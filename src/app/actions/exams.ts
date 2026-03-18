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
  departmentId: string;
}) {
  const session = await requireAuth();
  const parsed = examSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { courseId, date, time, roomIds, supervisorIds, instructorId, departmentId } = parsed.data;

  // Yetki kontrolü
  if (session.user.role !== "ADMIN") {
    if (departmentId !== session.user.departmentId) {
      throw new Error("Bu bölüm için sınav ekleyemezsiniz.");
    }
    // adminOnly kontrol
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (course?.adminOnly) throw new Error("Bu dersin sınavını yalnızca admin ekleyebilir.");

    // Atanmış salon kontrolü
    for (const roomId of roomIds) {
      const assignment = await prisma.roomAssignment.findFirst({
        where: { roomId, departmentId },
      });
      if (!assignment) throw new Error("Bu salona sınav ekleme yetkiniz yok.");
    }
  }

  // Çakışma kontrolü - salon
  for (const roomId of roomIds) {
    const conflict = await prisma.exam.findFirst({
      where: { date, time, roomIds: { has: roomId } },
    });
    if (conflict) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      throw new Error(`${room?.name ?? roomId} salonunda bu saatte zaten bir sınav var.`);
    }
  }

  // Çakışma kontrolü - hoca (ders sorumlusu)
  const instructorConflict = await prisma.exam.findFirst({
    where: { date, time, instructorId },
  });
  if (instructorConflict) {
    throw new Error("Bu hocanın bu tarih ve saatte başka bir sınavı var.");
  }

  const exam = await prisma.$transaction(async (tx) => {
    return tx.exam.create({
      data: {
        courseId,
        date,
        time,
        roomIds,
        supervisorIds,
        instructorId,
        departmentId,
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
    include: { course: true },
  });
  if (!exam) throw new Error("Sınav bulunamadı.");

  if (session.user.role !== "ADMIN") {
    if (exam.departmentId !== session.user.departmentId) {
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
    departmentId: string;
  }
) {
  const session = await requireAuth();
  const parsed = examSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { courseId, date, time, roomIds, supervisorIds, instructorId, departmentId } = parsed.data;

  const existing = await prisma.exam.findUnique({
    where: { id: examId },
    include: { course: true },
  });
  if (!existing) throw new Error("Sınav bulunamadı.");

  if (session.user.role !== "ADMIN") {
    if (existing.departmentId !== session.user.departmentId) {
      throw new Error("Bu sınavı düzenleme yetkiniz yok.");
    }
    if (existing.course.adminOnly) {
      throw new Error("Bu dersin sınavını yalnızca admin düzenleyebilir.");
    }
  }

  // Çakışma kontrolü (kendisi hariç)
  for (const roomId of roomIds) {
    const conflict = await prisma.exam.findFirst({
      where: { date, time, roomIds: { has: roomId }, NOT: { id: examId } },
    });
    if (conflict) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      throw new Error(`${room?.name ?? roomId} salonunda bu saatte zaten bir sınav var.`);
    }
  }

  const instructorConflict = await prisma.exam.findFirst({
    where: { date, time, instructorId, NOT: { id: examId } },
  });
  if (instructorConflict) throw new Error("Bu hocanın bu saatte başka sınavı var.");

  await prisma.$transaction(async (tx) => {
    await tx.exam.update({
      where: { id: examId },
      data: { courseId, date, time, roomIds, supervisorIds, instructorId, departmentId },
    });
  });

  revalidatePath("/schedule");
  revalidatePath("/room-program");
  revalidatePath("/instructor-program");

  return { success: true };
}
