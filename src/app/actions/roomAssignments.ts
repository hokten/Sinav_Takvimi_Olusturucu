"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function toggleRoomAssignment(roomId: string, departmentId: string) {
  await requireAdmin();

  const existing = await prisma.roomAssignment.findFirst({
    where: { roomId, departmentId },
  });

  if (existing) {
    await prisma.roomAssignment.delete({ where: { id: existing.id } });
  } else {
    await prisma.roomAssignment.create({ data: { roomId, departmentId } });
  }

  revalidatePath("/room-assignments");
  return { success: true };
}

export async function getRoomAssignments() {
  return prisma.roomAssignment.findMany({
    include: { room: true, department: true },
  });
}
