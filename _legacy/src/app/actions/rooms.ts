"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roomSchema = z.object({
  name: z.string().min(1, "Salon adı zorunludur"),
  capacity: z.number().int().min(0).default(0),
});

export async function createRoom(data: { name: string; capacity: number }) {
  await requireAdmin();
  const parsed = roomSchema.parse(data);
  try {
    await prisma.room.create({ data: { name: parsed.name, capacity: parsed.capacity } });
  } catch {
    throw new Error("Bu isimde salon zaten mevcut.");
  }
  revalidatePath("/rooms");
  revalidatePath("/room-assignments");
  revalidatePath("/room-program");
}

export async function updateRoom(id: string, data: { name: string; capacity: number }) {
  await requireAdmin();
  const parsed = roomSchema.parse(data);
  try {
    await prisma.room.update({ where: { id }, data: { name: parsed.name, capacity: parsed.capacity } });
  } catch {
    throw new Error("Bu isimde salon zaten mevcut.");
  }
  revalidatePath("/rooms");
  revalidatePath("/room-assignments");
  revalidatePath("/room-program");
}

export async function deleteRoom(id: string) {
  await requireAdmin();
  const hasExams = await prisma.exam.findFirst({ where: { roomIds: { has: id } } });
  if (hasExams) throw new Error("Bu salonda sınavlar var, önce sınavları silin.");
  await prisma.room.delete({ where: { id } });
  revalidatePath("/rooms");
  revalidatePath("/room-assignments");
  revalidatePath("/room-program");
}
