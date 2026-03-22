import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { InstructorsManager } from "@/components/shared/InstructorsManager";

export default async function InstructorsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== "ADMIN") redirect("/schedule");

  const programs = await prisma.program.findMany({ orderBy: { name: "asc" } });
  const instructors = await prisma.instructor.findMany({
    include: { mainProgram: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Öğretim Elemanları</h1>
      <InstructorsManager
        instructors={instructors as never}
        programs={programs}
      />
    </div>
  );
}
