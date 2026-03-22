import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { RoomsManager } from "@/components/shared/RoomsManager";

export default async function RoomsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== "ADMIN") redirect("/schedule");

  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Derslikler</h1>
      <RoomsManager rooms={rooms} />
    </div>
  );
}
