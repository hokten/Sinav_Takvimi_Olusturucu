import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      include: { instructor: true, program: true },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }]
    });
  }

  async create(data: any) {
    return this.prisma.course.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }

  async importCourses(rows: any[]) {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      const allDepts = await tx.department.findMany();
      const allPrograms = await tx.program.findMany();
      const allInstructors = await tx.instructor.findMany();

      const deptMap = new Map(allDepts.map((d) => [trLower(d.name), d.id]));
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

    return { created, skipped, errors };
  }
}
