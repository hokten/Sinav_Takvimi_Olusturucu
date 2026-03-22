import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoomProgramView } from "@/components/program/RoomProgramView";

export default async function RoomProgramPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userProgramIds = session.user.programIds ?? [];
  const isDeptHead = session.user.role === "DEPT_HEAD" && userProgramIds.length > 0;

  const [scheduleDays, rooms, programs, exams, activeSlotRequestsRaw, roomAssignments, mySlotRequests] =
    await Promise.all([
      prisma.scheduleDay.findMany({ orderBy: { date: "asc" } }),
      prisma.room.findMany({ orderBy: { name: "asc" } }),
      prisma.program.findMany(),
      prisma.exam.findMany({
        include: {
          course: true,
          instructor: true,
          program: true,
        },
      }),
      prisma.slotRequest.findMany({
        where: { status: { in: ["PENDING", "APPROVED"] } },
        select: {
          id: true,
          roomId: true,
          date: true,
          time: true,
          status: true,
          fromProgramId: true,
          fromProgram: { select: { name: true, color: true } },
          approvals: {
            select: {
              approved: true,
              program: { select: { id: true, name: true } },
            },
          },
          room: {
            select: {
              assignments: {
                select: {
                  program: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.roomAssignment.findMany(),
      isDeptHead
        ? prisma.slotRequest.findMany({
            where: {
              fromProgramId: { in: userProgramIds },
              status: { in: ["PENDING", "APPROVED", "REJECTED"] },
            },
          })
        : Promise.resolve([]),
    ]);

  const activeSlotRequests = activeSlotRequestsRaw.map((sr) => ({
    id: sr.id,
    roomId: sr.roomId,
    date: sr.date,
    time: sr.time,
    status: sr.status,
    fromProgramId: sr.fromProgramId,
    fromProgram: sr.fromProgram,
    approvals: sr.approvals,
    ownerPrograms: sr.room.assignments.map((a) => a.program),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Salon Programı</h1>
      <RoomProgramView
        scheduleDays={scheduleDays}
        rooms={rooms}
        programs={programs}
        exams={exams}
        userRole={session.user.role}
        userProgramId={session.user.programId ?? null}
        userProgramIds={userProgramIds}
        mySlotRequests={mySlotRequests}
        activeSlotRequests={activeSlotRequests}
        roomAssignments={roomAssignments}
      />
    </div>
  );
}
