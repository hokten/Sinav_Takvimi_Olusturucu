import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RequestsManager } from "@/components/shared/RequestsManager";
import type { Prisma, SlotRequestStatus } from "@prisma/client";

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const userProgramIds = session.user.programIds ?? [];

  if (isAdmin) {
    // Admin: tüm sorgular paralel
    const [requests, rooms, scheduleDays] = await Promise.all([
      prisma.slotRequest.findMany({
        where: { status: { in: ["PENDING", "APPROVED", "REJECTED"] } },
        include: {
          fromProgram: true,
          room: { include: { assignments: true } },
          approvals: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.room.findMany({ orderBy: { name: "asc" } }),
      prisma.scheduleDay.findMany({ orderBy: { date: "asc" } }),
    ]);

    const transformedRequests = requests.map((r) => ({
      id: r.id,
      fromProgramId: r.fromProgramId,
      roomId: r.roomId,
      date: r.date,
      time: r.time,
      status: r.status,
      fromProgram: r.fromProgram,
      room: { id: r.room.id, name: r.room.name },
      ownerProgramIds: r.room.assignments.map((a) => a.programId),
      approvals: r.approvals.map((a) => ({ programId: a.programId, approved: a.approved })),
    }));

    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-6">Talep Yönetimi</h1>
        <RequestsManager
          requests={transformedRequests}
          rooms={rooms}
          scheduleDays={scheduleDays}
          session={session}
          userPrograms={[]}
          userProgramIds={userProgramIds}
          userOwnedRoomIds={[]}
        />
      </div>
    );
  }

  // DEPT_HEAD: önce ownedRoomIds (requests sorgusu için gerekli)
  const ownedRoomAssignments = userProgramIds.length > 0
    ? await prisma.roomAssignment.findMany({ where: { programId: { in: userProgramIds } } })
    : [];
  const ownedRoomIds = ownedRoomAssignments.map((ra) => ra.roomId);

  const activeStatuses: SlotRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];
  const orConditions: Prisma.SlotRequestWhereInput[] = [
    ...(userProgramIds.length > 0
      ? [{ fromProgramId: { in: userProgramIds }, status: { in: activeStatuses } }]
      : []),
    ...(ownedRoomIds.length > 0
      ? [{ roomId: { in: ownedRoomIds }, status: "PENDING" as const }]
      : []),
  ];

  const [requests, rooms, scheduleDays, userPrograms] = await Promise.all([
    orConditions.length > 0
      ? prisma.slotRequest.findMany({
          where: { OR: orConditions },
          include: {
            fromProgram: true,
            room: { include: { assignments: true } },
            approvals: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.scheduleDay.findMany({ orderBy: { date: "asc" } }),
    prisma.program.findMany({
      where: { id: { in: userProgramIds } },
      orderBy: { name: "asc" },
    }),
  ]);

  const transformedRequests = requests.map((r) => ({
    id: r.id,
    fromProgramId: r.fromProgramId,
    roomId: r.roomId,
    date: r.date,
    time: r.time,
    status: r.status,
    fromProgram: r.fromProgram,
    room: { id: r.room.id, name: r.room.name },
    ownerProgramIds: r.room.assignments.map((a) => a.programId),
    approvals: r.approvals.map((a) => ({ programId: a.programId, approved: a.approved })),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Talep Yönetimi</h1>
      <RequestsManager
        requests={transformedRequests}
        rooms={rooms}
        scheduleDays={scheduleDays}
        session={session}
        userPrograms={userPrograms}
        userProgramIds={userProgramIds}
        userOwnedRoomIds={ownedRoomIds}
      />
    </div>
  );
}
