import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RequestsManager } from "@/components/shared/RequestsManager";

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";

  const requests = await prisma.slotRequest.findMany({
    where: isAdmin ? {} : { fromDepartmentId: session.user.departmentId ?? undefined },
    include: {
      fromDepartment: true,
      room: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const scheduleDays = await prisma.scheduleDay.findMany({ orderBy: { date: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Talep Yönetimi</h1>
      <RequestsManager
        requests={requests}
        rooms={rooms}
        scheduleDays={scheduleDays}
        session={session}
      />
    </div>
  );
}
