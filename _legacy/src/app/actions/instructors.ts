"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const instructorSchema = z.object({
  name: z.string().min(1, "Ad zorunludur"),
  mainProgramId: z.string().min(1, "Ana program zorunludur"),
  sideProgramIds: z.array(z.string()).default([]),
});

export async function createInstructor(data: {
  name: string;
  mainProgramId: string;
  sideProgramIds: string[];
}) {
  await requireAdmin();
  const parsed = instructorSchema.parse(data);

  await prisma.instructor.create({ data: parsed });
  revalidatePath("/instructors");
  revalidatePath("/instructor-program");
  revalidatePath("/schedule");
}

export async function updateInstructor(
  id: string,
  data: { name: string; mainProgramId: string; sideProgramIds: string[] }
) {
  await requireAdmin();
  const parsed = instructorSchema.parse(data);

  await prisma.instructor.update({ where: { id }, data: parsed });
  revalidatePath("/instructors");
  revalidatePath("/instructor-program");
  revalidatePath("/schedule");
}

export async function deleteInstructor(id: string) {
  await requireAdmin();

  const hasExams = await prisma.exam.findFirst({
    where: { instructorId: id },
  });
  if (hasExams) {
    throw new Error("Bu öğretim elemanına ait sınavlar var, önce sınavları silin.");
  }

  const hasCourses = await prisma.course.findFirst({
    where: { instructorId: id },
  });
  if (hasCourses) {
    throw new Error("Bu öğretim elemanına ait dersler var, önce dersleri silin.");
  }

  await prisma.instructor.delete({ where: { id } });
  revalidatePath("/instructors");
  revalidatePath("/instructor-program");
}
