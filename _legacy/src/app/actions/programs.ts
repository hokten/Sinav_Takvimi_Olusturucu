"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const programSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  color: z.string().default("#3B82F6"),
  departmentId: z.string().min(1, "Bölüm zorunludur"),
  isSharedSource: z.boolean().optional().default(false),
});

export async function createProgram(data: {
  name: string;
  color: string;
  departmentId: string;
  isSharedSource?: boolean;
}) {
  await requireAdmin();
  const parsed = programSchema.parse(data);
  await prisma.program.create({
    data: {
      name: parsed.name,
      color: parsed.color,
      departmentId: parsed.departmentId,
      isSharedSource: parsed.isSharedSource ?? false,
    },
  });
  revalidatePath("/departments");
  revalidatePath("/schedule");
}

export async function updateProgram(
  id: string,
  data: { name: string; color: string; departmentId: string; isSharedSource?: boolean }
) {
  await requireAdmin();
  const parsed = programSchema.parse(data);
  await prisma.program.update({
    where: { id },
    data: {
      name: parsed.name,
      color: parsed.color,
      departmentId: parsed.departmentId,
      isSharedSource: parsed.isSharedSource ?? false,
    },
  });
  revalidatePath("/departments");
  revalidatePath("/schedule");
  revalidatePath("/room-program");
  revalidatePath("/instructor-program");
}

export async function deleteProgram(id: string) {
  await requireAdmin();

  const hasCourses = await prisma.course.findFirst({ where: { programId: id } });
  if (hasCourses) throw new Error("Bu programa ait dersler var, önce dersleri silin.");

  const hasInstructors = await prisma.instructor.findFirst({ where: { mainProgramId: id } });
  if (hasInstructors)
    throw new Error("Bu programın öğretim elemanları var, önce öğretim elemanlarını silin.");

  await prisma.program.delete({ where: { id } });
  revalidatePath("/departments");
  revalidatePath("/schedule");
}
