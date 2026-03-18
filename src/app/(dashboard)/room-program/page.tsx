import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoomProgramView } from "@/components/program/RoomProgramView";

export default async function RoomProgramPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const scheduleDays = await prisma.scheduleDay.findMany({ orderBy: { date: "asc" } });
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const departments = await prisma.department.findMany();

  const exams = await prisma.exam.findMany({
    include: {
      course: true,
      instructor: true,
      department: true,
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Salon Programı</h1>
      <RoomProgramView
        scheduleDays={scheduleDays}
        rooms={rooms}
        departments={departments}
        exams={exams}
      />
    </div>
  );
}
