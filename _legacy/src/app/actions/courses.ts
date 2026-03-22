"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const courseSchema = z.object({
  code: z.string().min(1, "Ders kodu zorunludur"),
  name: z.string().min(1, "Ders adı zorunludur"),
  section: z.number().int().min(1).default(1),
  grade: z.number().int().min(1).max(4).default(1),
  quota: z.number().int().min(1).default(30),
  programId: z.string().min(1, "Program zorunludur"),
  instructorId: z.string().min(1, "Öğretim elemanı zorunludur"),
  adminOnly: z.boolean().default(false),
});

export async function createCourse(data: {
  code: string;
  name: string;
  section: number;
  grade: number;
  quota: number;
  programId: string;
  instructorId: string;
  adminOnly: boolean;
}) {
  await requireAdmin();
  const parsed = courseSchema.parse(data);

  await prisma.course.create({ data: parsed });
  revalidatePath("/courses");
  revalidatePath("/schedule");
}

export async function updateCourse(
  id: string,
  data: {
    code: string;
    name: string;
    section: number;
    grade: number;
    quota: number;
    programId: string;
    instructorId: string;
    adminOnly: boolean;
  }
) {
  await requireAdmin();
  const parsed = courseSchema.parse(data);

  await prisma.course.update({ where: { id }, data: parsed });
  revalidatePath("/courses");
  revalidatePath("/schedule");
}

export async function deleteCourse(id: string) {
  await requireAdmin();

  const hasExams = await prisma.exam.findFirst({ where: { courseId: id } });
  if (hasExams) {
    throw new Error("Bu derse ait sınavlar var, önce sınavları silin.");
  }

  await prisma.course.delete({ where: { id } });
  revalidatePath("/courses");
  revalidatePath("/schedule");
}

export interface ImportCourseRow {
  code: string;
  name: string;
  section: number;
  grade: number;
  quota: number;
  parentDeptName: string;  // Bölüm (üst birim)
  departmentName: string;  // Program (alt birim, course'un bağlı olduğu)
  instructorName: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR").trim();
}

function formatInstructorName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return name.trim();
  const surname = words[words.length - 1].toLocaleUpperCase("tr-TR");
  const firstNames = words.slice(0, -1).map(
    (w) => w[0].toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR")
  );
  return [...firstNames, surname].join(" ");
}

export async function importCourses(rows: ImportCourseRow[]): Promise<ImportResult> {
  await requireAdmin();

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  await prisma.$transaction(async (tx) => {
    const allDepts = await tx.department.findMany();
    const allPrograms = await tx.program.findMany();
    const allInstructors = await tx.instructor.findMany();

    // departmentName → departmentId
    const deptMap = new Map(allDepts.map((d) => [trLower(d.name), d.id]));
    // "deptId:programName" → programId
    const programMap = new Map(
      allPrograms.map((p) => [`${p.departmentId}:${trLower(p.name)}`, p.id])
    );

    const instrMap = new Map(allInstructors.map((i) => [trLower(i.name), i.id]));
    const affectedInstructorIds = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const deptId = deptMap.get(trLower(row.parentDeptName));
      if (!deptId) {
        errors.push(`Satır ${rowNum}: "${row.parentDeptName}" bölümü bulunamadı.`);
        skipped++;
        continue;
      }

      const programKey = `${deptId}:${trLower(row.departmentName)}`;
      let programId = programMap.get(programKey);
      if (!programId) {
        if (!row.departmentName.trim()) {
          errors.push(`Satır ${rowNum}: Program adı boş.`);
          skipped++;
          continue;
        }
        const newProgram = await tx.program.create({
          data: { name: row.departmentName.trim(), departmentId: deptId, color: "#3B82F6" },
        });
        programId = newProgram.id;
        programMap.set(programKey, programId);
      }

      let instrId = instrMap.get(trLower(row.instructorName));
      if (!instrId) {
        if (!row.instructorName.trim()) {
          errors.push(`Satır ${rowNum}: Öğretim elemanı adı boş.`);
          skipped++;
          continue;
        }
        const formattedName = formatInstructorName(row.instructorName);
        const newInstructor = await tx.instructor.create({
          data: { name: formattedName, mainProgramId: programId },
        });
        instrId = newInstructor.id;
        instrMap.set(trLower(row.instructorName), instrId);
      }

      affectedInstructorIds.add(instrId);

      const existing = await tx.course.findFirst({
        where: { code: row.code, section: row.section, programId },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await tx.course.create({
        data: {
          code: row.code,
          name: row.name,
          section: row.section,
          grade: row.grade,
          quota: row.quota,
          programId,
          instructorId: instrId,
          adminOnly: false,
        },
      });
      created++;
    }

    for (const instrId of affectedInstructorIds) {
      const courseCounts = await tx.course.groupBy({
        by: ["programId"],
        where: { instructorId: instrId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      });
      if (courseCounts.length === 0) continue;

      const mainProgramId = courseCounts[0].programId;
      const sideProgramIds = courseCounts.slice(1).map((c) => c.programId);

      await tx.instructor.update({
        where: { id: instrId },
        data: { mainProgramId, sideProgramIds },
      });
    }
  });

  revalidatePath("/courses");
  revalidatePath("/schedule");
  revalidatePath("/instructors");

  return { created, skipped, errors };
}
