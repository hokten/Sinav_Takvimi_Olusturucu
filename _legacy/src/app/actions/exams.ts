"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { examSchema } from "@/lib/validations";

export async function createExam(data: {
  courseId: string;
  date: string;
  time: string;
  roomIds: string[];
  supervisorIds: string[];
  instructorId: string;
  programId: string;
}) {
  const session = await requireAuth();
  const parsed = examSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { courseId, date, time, roomIds, supervisorIds, instructorId, programId } = parsed.data;

  const program = await prisma.program.findUnique({ where: { id: programId } });

  if (program?.isSharedSource && session.user.role !== "ADMIN") {
    throw new Error("Bu programa yalnızca yönetici sınav ekleyebilir.");
  }

  if (session.user.role !== "ADMIN") {
    const userProgramIds = session.user.programIds ?? [];
    if (!userProgramIds.includes(programId)) {
      throw new Error("Bu program için sınav ekleyemezsiniz.");
    }
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (course?.adminOnly) throw new Error("Bu dersin sınavını yalnızca admin ekleyebilir.");

    await Promise.all(
      roomIds.map(async (roomId) => {
        const assignment = await prisma.roomAssignment.findFirst({
          where: { roomId, programId },
        });

        if (!assignment) {
          const approvedReq = await prisma.slotRequest.findFirst({
            where: { fromProgramId: programId, roomId, date, time, status: "APPROVED" },
          });
          if (!approvedReq) throw new Error("Bu salona sınav ekleme yetkiniz yok.");
        } else {
          const reservation = await prisma.slotRequest.findFirst({
            where: { roomId, date, time, status: "APPROVED", NOT: { fromProgramId: programId } },
          });
          if (reservation) {
            const room = await prisma.room.findUnique({ where: { id: roomId } });
            throw new Error(`${room?.name ?? roomId} salonu bu saatte başka bir bölüme rezerve edilmiştir.`);
          }
        }
      })
    );
  }

  // Çakışma kontrolü - salon ve hoca paralel
  await Promise.all([
    ...roomIds.map(async (roomId) => {
      const conflict = await prisma.exam.findFirst({
        where: { date, time, roomIds: { has: roomId } },
      });
      if (conflict) {
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        throw new Error(`${room?.name ?? roomId} salonunda bu saatte zaten bir sınav var.`);
      }
    }),
    prisma.exam.findFirst({ where: { date, time, instructorId } }).then((conflict) => {
      if (conflict) throw new Error("Bu hocanın bu tarih ve saatte başka bir sınavı var.");
    }),
  ]);

  const isShared = program?.isSharedSource ?? false;

  const exam = await prisma.$transaction(async (tx) => {
    return tx.exam.create({
      data: {
        courseId,
        date,
        time,
        roomIds,
        supervisorIds: isShared ? [] : supervisorIds,
        instructorId,
        programId,
        isShared,
        createdById: session.user.id,
      },
    });
  });

  revalidatePath("/schedule");
  revalidatePath("/room-program");
  revalidatePath("/instructor-program");

  return { success: true, examId: exam.id };
}

export async function deleteExam(examId: string) {
  const session = await requireAuth();

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { course: true, createdBy: true },
  });
  if (!exam) throw new Error("Sınav bulunamadı.");

  if (exam.isShared && session.user.role !== "ADMIN") {
    throw new Error("Paylaşımlı sınavı yalnızca yönetici silebilir.");
  }

  if (!exam.isShared && exam.createdBy.role === "ADMIN" && session.user.role !== "ADMIN") {
    throw new Error("Bu sınav yalnızca yönetici tarafından silinebilir.");
  }

  if (session.user.role !== "ADMIN") {
    const userProgramIds = session.user.programIds ?? [];
    if (!userProgramIds.includes(exam.programId)) {
      throw new Error("Bu sınavı silme yetkiniz yok.");
    }
    if (exam.course.adminOnly) {
      throw new Error("Bu dersin sınavını yalnızca admin silebilir.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.exam.delete({ where: { id: examId } });
  });

  revalidatePath("/schedule");
  revalidatePath("/room-program");
  revalidatePath("/instructor-program");

  return { success: true };
}

export async function updateExam(
  examId: string,
  data: {
    courseId: string;
    date: string;
    time: string;
    roomIds: string[];
    supervisorIds: string[];
    instructorId: string;
    programId: string;
  }
) {
  const session = await requireAuth();
  const parsed = examSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { courseId, date, time, roomIds, supervisorIds, instructorId, programId } = parsed.data;

  const existing = await prisma.exam.findUnique({
    where: { id: examId },
    include: { course: true, createdBy: true },
  });
  if (!existing) throw new Error("Sınav bulunamadı.");

  if (existing.isShared && session.user.role !== "ADMIN") {
    throw new Error("Paylaşımlı sınavı yalnızca yönetici düzenleyebilir.");
  }

  if (!existing.isShared && existing.createdBy.role === "ADMIN" && session.user.role !== "ADMIN") {
    throw new Error("Bu sınav yalnızca yönetici tarafından düzenlenebilir.");
  }

  if (session.user.role !== "ADMIN") {
    const userProgramIds = session.user.programIds ?? [];
    if (!userProgramIds.includes(existing.programId)) {
      throw new Error("Bu sınavı düzenleme yetkiniz yok.");
    }
    if (existing.course.adminOnly) {
      throw new Error("Bu dersin sınavını yalnızca admin düzenleyebilir.");
    }

    await Promise.all(
      roomIds.map(async (roomId) => {
        const assignment = await prisma.roomAssignment.findFirst({
          where: { roomId, programId },
        });

        if (!assignment) {
          const approvedReq = await prisma.slotRequest.findFirst({
            where: { fromProgramId: programId, roomId, date, time, status: "APPROVED" },
          });
          if (!approvedReq) throw new Error("Bu salona sınav ekleme yetkiniz yok.");
        } else {
          const reservation = await prisma.slotRequest.findFirst({
            where: { roomId, date, time, status: "APPROVED", NOT: { fromProgramId: programId } },
          });
          if (reservation) {
            const room = await prisma.room.findUnique({ where: { id: roomId } });
            throw new Error(`${room?.name ?? roomId} salonu bu saatte başka bir bölüme rezerve edilmiştir.`);
          }
        }
      })
    );
  }

  await Promise.all([
    ...roomIds.map(async (roomId) => {
      const conflict = await prisma.exam.findFirst({
        where: { date, time, roomIds: { has: roomId }, NOT: { id: examId } },
      });
      if (conflict) {
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        throw new Error(`${room?.name ?? roomId} salonunda bu saatte zaten bir sınav var.`);
      }
    }),
    prisma.exam.findFirst({ where: { date, time, instructorId, NOT: { id: examId } } }).then((conflict) => {
      if (conflict) throw new Error("Bu hocanın bu saatte başka sınavı var.");
    }),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.exam.update({
      where: { id: examId },
      data: {
        courseId,
        date,
        time,
        roomIds,
        supervisorIds: existing.isShared ? existing.supervisorIds : supervisorIds,
        instructorId,
        programId,
      },
    });
  });

  revalidatePath("/schedule");
  revalidatePath("/room-program");
  revalidatePath("/instructor-program");

  return { success: true };
}

export async function assignSupervisorsToAdminExam(examId: string, supervisorIds: string[]) {
  const session = await requireAuth();

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { createdBy: true },
  });
  if (!exam) throw new Error("Sınav bulunamadı.");
  if (exam.isShared) throw new Error("Paylaşımlı sınavlar için bu işlem kullanılamaz.");
  if (exam.createdBy.role !== "ADMIN") throw new Error("Bu sınav admin tarafından oluşturulmamış.");
  if (exam.supervisorIds.length > 0 && session.user.role !== "ADMIN") {
    throw new Error("Bu sınavın gözetmenleri yönetici tarafından belirlenmiştir.");
  }

  if (session.user.role !== "ADMIN") {
    const userProgramIds = session.user.programIds ?? [];
    if (!userProgramIds.includes(exam.programId)) {
      throw new Error("Bu sınav için gözetmen atama yetkiniz yok.");
    }
    if (supervisorIds.length !== exam.roomIds.length) {
      throw new Error(
        `${exam.roomIds.length} salon için tam ${exam.roomIds.length} gözetmen atanmalıdır. (Şu an: ${supervisorIds.length})`
      );
    }
  }

  await prisma.exam.update({
    where: { id: examId },
    data: { supervisorIds },
  });

  revalidatePath("/schedule");
  return { success: true };
}

export async function updateSharedExamSupervisors(
  examId: string,
  programId: string,
  supervisorIds: string[]
) {
  const session = await requireAuth();

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new Error("Sınav bulunamadı.");
  if (!exam.isShared) throw new Error("Bu sınav paylaşımlı değil.");

  if (session.user.role !== "ADMIN") {
    const userProgramIds = session.user.programIds ?? [];
    if (!userProgramIds.includes(programId)) {
      throw new Error("Bu program için gözetmen atama yetkiniz yok.");
    }
    if (supervisorIds.length !== exam.roomIds.length) {
      throw new Error(
        `${exam.roomIds.length} salon için tam ${exam.roomIds.length} gözetmen atanmalıdır. (Şu an: ${supervisorIds.length})`
      );
    }
  }

  await prisma.sharedExamSupervisors.upsert({
    where: { examId_programId: { examId, programId } },
    create: { examId, programId, supervisorIds },
    update: { supervisorIds },
  });

  revalidatePath("/schedule");

  return { success: true };
}
