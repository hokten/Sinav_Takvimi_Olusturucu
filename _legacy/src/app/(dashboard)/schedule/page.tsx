import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScheduleDocument } from "@/components/schedule/ScheduleDocument";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const userProgramIds = session.user.programIds ?? [];

  // Program listesi editableProgramIds için önce çekilmeli
  let programs: { id: string; name: string; color: string; isSharedSource: boolean }[];
  let editableProgramIds: string[];

  if (isAdmin) {
    const allPrograms = await prisma.program.findMany({ orderBy: { name: "asc" } });
    programs = allPrograms;
    editableProgramIds = allPrograms.map((p) => p.id);
  } else if (userProgramIds.length > 0) {
    const userPrograms = await prisma.program.findMany({
      where: { id: { in: userProgramIds }, isSharedSource: false },
      orderBy: { name: "asc" },
    });
    programs = userPrograms;
    editableProgramIds = userPrograms.map((p) => p.id);
  } else {
    programs = [];
    editableProgramIds = [];
  }

  // Geri kalan tüm bağımsız sorgular paralel çalışır
  const [
    scheduleDays,
    exams,
    rooms,
    instructors,
    courses,
    roomAssignments,
    sharedSourcePrograms,
    approvedReservations,
    allExamsRaw,
  ] = await Promise.all([
    prisma.scheduleDay.findMany({ orderBy: { date: "asc" } }),
    prisma.exam.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { programId: { in: editableProgramIds } },
              { isShared: true },
            ],
          },
      include: {
        course: { include: { instructor: true, program: true } },
        instructor: true,
        program: true,
        deptSupervisors: true,
        createdBy: { select: { role: true } },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    isAdmin
      ? prisma.instructor.findMany({ orderBy: { name: "asc" } })
      : prisma.instructor.findMany({
          where: {
            OR: [
              { mainProgramId: { in: editableProgramIds } },
              ...editableProgramIds.map((id) => ({ sideProgramIds: { has: id } })),
            ],
          },
          orderBy: { name: "asc" },
        }),
    isAdmin
      ? prisma.course.findMany({ include: { instructor: true, program: true } })
      : prisma.course.findMany({
          where: { programId: { in: editableProgramIds } },
          include: { instructor: true, program: true },
        }),
    isAdmin
      ? prisma.roomAssignment.findMany()
      : prisma.roomAssignment.findMany({
          where: { programId: { in: editableProgramIds } },
        }),
    prisma.program.findMany({
      where: { isSharedSource: true },
      select: { id: true },
    }),
    prisma.slotRequest.findMany({
      where: { status: "APPROVED" },
      select: {
        roomId: true,
        date: true,
        time: true,
        fromProgramId: true,
        fromProgram: { select: { name: true, color: true } },
      },
    }),
    // DEPT_HEAD için tüm sınavlar gerekli (çakışma kontrolü); admin için exams'ten türetilir
    isAdmin
      ? Promise.resolve(null)
      : prisma.exam.findMany({
          select: {
            id: true,
            courseId: true,
            date: true,
            time: true,
            roomIds: true,
            supervisorIds: true,
            instructorId: true,
            programId: true,
            isShared: true,
          },
        }),
  ]);

  const sharedSourceProgramIds = sharedSourcePrograms.map((p) => p.id);

  // Admin için allExams, exams'ten türetilir (ekstra sorgu yok)
  const allExams = isAdmin
    ? exams.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        date: e.date,
        time: e.time,
        roomIds: e.roomIds,
        supervisorIds: e.supervisorIds,
        instructorId: e.instructorId,
        programId: e.programId,
        isShared: e.isShared,
      }))
    : (allExamsRaw ?? []);

  return (
    <ScheduleDocument
      programs={programs}
      editableProgramIds={editableProgramIds}
      sharedSourceProgramIds={sharedSourceProgramIds}
      scheduleDays={scheduleDays}
      exams={exams}
      allExams={allExams}
      rooms={rooms}
      instructors={instructors}
      courses={courses}
      roomAssignments={roomAssignments}
      approvedReservations={approvedReservations}
      session={session}
    />
  );
}
