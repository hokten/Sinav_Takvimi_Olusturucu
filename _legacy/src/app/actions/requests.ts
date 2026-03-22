"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { slotRequestSchema } from "@/lib/validations";

export async function createSlotRequest(data: {
  programId: string;
  roomId: string;
  date: string;
  time: string;
}) {
  const session = await requireAuth();
  if (session.user.role !== "DEPT_HEAD") throw new Error("Yalnızca bölüm başkanları talep oluşturabilir.");

  const userProgramIds = session.user.programIds ?? [];
  if (!data.programId || !userProgramIds.includes(data.programId)) {
    throw new Error("Bu program için talep oluşturamazsınız.");
  }

  const parsed = slotRequestSchema.safeParse({ roomId: data.roomId, date: data.date, time: data.time });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  // Geri çekilmiş talepler dışında aktif talep varsa engelle
  const existing = await prisma.slotRequest.findFirst({
    where: {
      fromProgramId: data.programId,
      roomId: parsed.data.roomId,
      date: parsed.data.date,
      time: parsed.data.time,
      status: { in: ["PENDING", "APPROVED", "REJECTED"] },
    },
  });
  if (existing) throw new Error("Bu slot için zaten aktif bir talebiniz mevcut.");

  await prisma.slotRequest.create({
    data: {
      fromProgramId: data.programId,
      ...parsed.data,
    },
  });

  revalidatePath("/requests");
  revalidatePath("/room-program");
  return { success: true };
}

export async function approveSlotRequest(requestId: string) {
  const session = await requireAuth();
  const userProgramIds = session.user.programIds ?? [];

  const request = await prisma.slotRequest.findUnique({
    where: { id: requestId },
    include: {
      room: { include: { assignments: true } },
    },
  });
  if (!request) throw new Error("Talep bulunamadı.");
  if (request.status !== "PENDING") throw new Error("Bu talep artık beklemede değil.");

  const ownerProgramIds = request.room.assignments.map((a) => a.programId);
  const myOwnerProgramIds = ownerProgramIds.filter((pid) => userProgramIds.includes(pid));

  if (myOwnerProgramIds.length === 0) {
    throw new Error("Bu talep için onay verme yetkiniz yok.");
  }

  await prisma.$transaction(async (tx) => {
    for (const programId of myOwnerProgramIds) {
      await tx.slotRequestApproval.upsert({
        where: { slotRequestId_programId: { slotRequestId: requestId, programId } },
        create: { slotRequestId: requestId, programId, approved: true },
        update: { approved: true },
      });
    }

    // Tüm sahip programlar onayladıysa talebi onayla
    const allApprovals = await tx.slotRequestApproval.findMany({
      where: { slotRequestId: requestId },
    });
    const approvedSet = new Set(allApprovals.filter((a) => a.approved).map((a) => a.programId));
    const allApproved = ownerProgramIds.every((pid) => approvedSet.has(pid));

    if (allApproved) {
      await tx.slotRequest.update({ where: { id: requestId }, data: { status: "APPROVED" } });
    }
  });

  revalidatePath("/requests");
  revalidatePath("/room-program");
  revalidatePath("/schedule");
  return { success: true };
}

export async function rejectSlotRequest(requestId: string) {
  const session = await requireAuth();
  const userProgramIds = session.user.programIds ?? [];

  const request = await prisma.slotRequest.findUnique({
    where: { id: requestId },
    include: {
      room: { include: { assignments: true } },
    },
  });
  if (!request) throw new Error("Talep bulunamadı.");
  if (request.status !== "PENDING") throw new Error("Bu talep artık beklemede değil.");

  const ownerProgramIds = request.room.assignments.map((a) => a.programId);
  const myOwnerProgramIds = ownerProgramIds.filter((pid) => userProgramIds.includes(pid));

  if (myOwnerProgramIds.length === 0) {
    throw new Error("Bu talep için red verme yetkiniz yok.");
  }

  await prisma.$transaction(async (tx) => {
    for (const programId of myOwnerProgramIds) {
      await tx.slotRequestApproval.upsert({
        where: { slotRequestId_programId: { slotRequestId: requestId, programId } },
        create: { slotRequestId: requestId, programId, approved: false },
        update: { approved: false },
      });
    }
    await tx.slotRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } });
  });

  revalidatePath("/requests");
  revalidatePath("/room-program");
  revalidatePath("/schedule");
  return { success: true };
}

export async function withdrawSlotRequest(requestId: string) {
  const session = await requireAuth();
  if (session.user.role !== "DEPT_HEAD") throw new Error("Yalnızca bölüm başkanları talep geri çekebilir.");

  const userProgramIds = session.user.programIds ?? [];
  const request = await prisma.slotRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Talep bulunamadı.");
  if (!userProgramIds.includes(request.fromProgramId)) throw new Error("Bu talebi geri çekme yetkiniz yok.");
  if (request.status !== "PENDING") throw new Error("Yalnızca beklemedeki talepler geri çekilebilir.");

  await prisma.slotRequest.update({
    where: { id: requestId },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath("/requests");
  revalidatePath("/room-program");
  return { success: true };
}
