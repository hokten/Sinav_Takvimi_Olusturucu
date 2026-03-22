import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DepartmentsManager } from "@/components/shared/DepartmentsManager";

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== "ADMIN") redirect("/schedule");

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      programs: { orderBy: { name: "asc" } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Bölümler ve Programlar</h1>
      <DepartmentsManager departments={departments as never} />
    </div>
  );
}
