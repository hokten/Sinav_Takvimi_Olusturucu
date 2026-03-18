import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InstructorProgramView } from "@/components/program/InstructorProgramView";

export default async function InstructorProgramPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const deptId = session.user.departmentId;

  const scheduleDays = await prisma.scheduleDay.findMany({ orderBy: { date: "asc" } });
  const departments = await prisma.department.findMany();

  const instructors = isAdmin
    ? await prisma.instructor.findMany({ include: { mainDept: true } })
    : await prisma.instructor.findMany({
        where: {
          OR: [
            { mainDeptId: deptId ?? undefined },
            { sideDeptIds: { has: deptId ?? "" } },
          ],
        },
        include: { mainDept: true },
      });

  const exams = await prisma.exam.findMany({
    include: {
      course: true,
      instructor: { include: { mainDept: true } },
      department: true,
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Hoca Programı</h1>
      <InstructorProgramView
        scheduleDays={scheduleDays}
        instructors={instructors}
        departments={departments}
        exams={exams}
      />
    </div>
  );
}
