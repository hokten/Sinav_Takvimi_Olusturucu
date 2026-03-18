"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/permissions";
import { slotRequestSchema } from "@/lib/validations";

export async function createSlotRequest(data: {
  roomId: string;
  date: string;
  time: string;
}) {
  const session = await requireAuth();
  if (session.user.role !== "DEPT_HEAD") throw new Error("Yalnızca bölüm başkanları talep oluşturabilir.");
  if (!session.user.departmentId) throw new Error("Bölüm bilgisi bulunamadı.");

  const parsed = slotRequestSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  // Zaten talep var mı?
  const existing = await prisma.slotRequest.findFirst({
    where: {
      fromDepartmentId: session.user.departmentId,
      roomId: parsed.data.roomId,
      date: parsed.data.date,
      time: parsed.data.time,
    },
  });
  if (existing) throw new Error("Bu slot için zaten bir talebiniz mevcut.");

  await prisma.slotRequest.create({
    data: {
      fromDepartmentId: session.user.departmentId,
      ...parsed.data,
    },
  });

  revalidatePath("/requests");
  return { success: true };
}

export async function approveSlotRequest(requestId: string) {
  await requireAdmin();
  await prisma.slotRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });
  revalidatePath("/requests");
  return { success: true };
}

export async function rejectSlotRequest(requestId: string) {
  await requireAdmin();
  await prisma.slotRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/requests");
  return { success: true };
}
