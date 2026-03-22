import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SessionsManager } from "@/components/shared/SessionsManager";

export default async function SessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/schedule");

  const scheduleDays = await prisma.scheduleDay.findMany({ orderBy: { date: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Oturum Yönetimi</h1>
      <SessionsManager scheduleDays={scheduleDays} />
    </div>
  );
}
