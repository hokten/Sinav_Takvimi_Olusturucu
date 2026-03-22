import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CoursesManager } from "@/components/shared/CoursesManager";

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (session.user.role !== "ADMIN") redirect("/schedule");

  const programs = await prisma.program.findMany({ orderBy: { name: "asc" } });
  const instructors = await prisma.instructor.findMany({ orderBy: { name: "asc" } });
  const courses = await prisma.course.findMany({
    include: { program: true, instructor: true },
    orderBy: [{ programId: "asc" }, { code: "asc" }],
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dersler</h1>
      <CoursesManager
        courses={courses as never}
        programs={programs}
        instructors={instructors}
      />
    </div>
  );
}
