import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoomAssignmentsManager } from "@/components/shared/RoomAssignmentsManager";

export default async function RoomAssignmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/schedule");

  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const programs = await prisma.program.findMany({ orderBy: { name: "asc" } });
  const assignments = await prisma.roomAssignment.findMany();

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Sınıf Atamaları</h1>
      <RoomAssignmentsManager rooms={rooms} programs={programs} assignments={assignments} />
    </div>
  );
}
