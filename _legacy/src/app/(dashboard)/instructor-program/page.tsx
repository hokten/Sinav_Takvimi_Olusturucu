import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InstructorProgramView } from "@/components/program/InstructorProgramView";

export default async function InstructorProgramPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const userProgramIds = session.user.programIds ?? [];

  const [scheduleDays, programs, rooms, instructors, exams] = await Promise.all([
    prisma.scheduleDay.findMany({ orderBy: { date: "asc" } }),
    prisma.program.findMany(),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    isAdmin
      ? prisma.instructor.findMany({ include: { mainProgram: true } })
      : prisma.instructor.findMany({
          where: {
            OR: userProgramIds.flatMap((id) => [
              { mainProgramId: id },
              { sideProgramIds: { has: id } },
            ]),
          },
          include: { mainProgram: true },
        }),
    prisma.exam.findMany({
      include: {
        course: true,
        instructor: { include: { mainProgram: true } },
        program: true,
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Hoca Programı</h1>
      <InstructorProgramView
        scheduleDays={scheduleDays}
        instructors={instructors}
        programs={programs}
        exams={exams}
        rooms={rooms}
      />
    </div>
  );
}
