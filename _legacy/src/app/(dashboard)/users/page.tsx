import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { UsersManager } from "@/components/shared/UsersManager";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== "ADMIN") redirect("/schedule");

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: {
        programs: { include: { program: { include: { department: true } } } },
      },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Kullanıcılar</h1>
      <UsersManager
        users={users as never}
        departments={departments}
        currentUserId={session.user.id}
      />
    </div>
  );
}
