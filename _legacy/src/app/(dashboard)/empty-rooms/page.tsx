import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmptyRoomsView } from "@/components/program/EmptyRoomsView";

export default async function EmptyRoomsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const scheduleDays = await prisma.scheduleDay.findMany({ orderBy: { date: "asc" } });
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const exams = await prisma.exam.findMany({ select: { id: true, date: true, time: true, roomIds: true } });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Boş Salon Bulucu</h1>
      <p className="text-sm text-gray-500 mb-6">Seçilen tarih ve oturumda hangi salonların boş olduğunu görün.</p>
      <EmptyRoomsView scheduleDays={scheduleDays} rooms={rooms} exams={exams} />
    </div>
  );
}
