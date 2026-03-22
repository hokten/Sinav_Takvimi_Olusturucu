"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { scheduleDaySchema } from "@/lib/validations";

export async function createScheduleDay(data: { date: string; sessions: string[] }) {
  await requireAdmin();
  const parsed = scheduleDaySchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const existing = await prisma.scheduleDay.findUnique({ where: { date: parsed.data.date } });
  if (existing) throw new Error("Bu tarihte zaten bir gün mevcut.");

  await prisma.scheduleDay.create({ data: parsed.data });
  revalidatePath("/sessions");
  revalidatePath("/schedule");
  return { success: true };
}

export async function updateScheduleDay(id: string, sessions: string[]) {
  await requireAdmin();
  await prisma.scheduleDay.update({ where: { id }, data: { sessions } });
  revalidatePath("/sessions");
  revalidatePath("/schedule");
  return { success: true };
}

export async function deleteScheduleDay(id: string) {
  await requireAdmin();
  await prisma.scheduleDay.delete({ where: { id } });
  revalidatePath("/sessions");
  revalidatePath("/schedule");
  return { success: true };
}

export async function getScheduleDays() {
  return prisma.scheduleDay.findMany({ orderBy: { date: "asc" } });
}
