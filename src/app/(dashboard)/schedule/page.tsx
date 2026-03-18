import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScheduleDocument } from "@/components/schedule/ScheduleDocument";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";

  // Fetch departments
  const departments = isAdmin
    ? await prisma.department.findMany({ orderBy: { name: "asc" } })
    : await prisma.department.findMany({
        where: { id: session.user.departmentId ?? undefined },
      });

  // Fetch schedule days
  const scheduleDays = await prisma.scheduleDay.findMany({ orderBy: { date: "asc" } });

  // Fetch all exams (with relations) for the relevant departments
  const exams = await prisma.exam.findMany({
    where: isAdmin ? {} : { departmentId: session.user.departmentId ?? undefined },
    include: {
      course: { include: { instructor: true } },
      instructor: true,
      department: true,
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  // Fetch rooms
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });

  // Fetch instructors for exam creation
  const instructors = isAdmin
    ? await prisma.instructor.findMany({ orderBy: { name: "asc" } })
    : await prisma.instructor.findMany({
        where: {
          OR: [
            { mainDeptId: session.user.departmentId ?? undefined },
            { sideDeptIds: { has: session.user.departmentId ?? "" } },
          ],
        },
        orderBy: { name: "asc" },
      });

  // Fetch courses
  const courses = isAdmin
    ? await prisma.course.findMany({ include: { instructor: true } })
    : await prisma.course.findMany({
        where: { departmentId: session.user.departmentId ?? undefined },
        include: { instructor: true },
      });

  // Fetch room assignments for the user's department
  const roomAssignments = isAdmin
    ? await prisma.roomAssignment.findMany()
    : await prisma.roomAssignment.findMany({
        where: { departmentId: session.user.departmentId ?? undefined },
      });

  return (
    <ScheduleDocument
      departments={departments}
      scheduleDays={scheduleDays}
      exams={exams}
      rooms={rooms}
      instructors={instructors}
      courses={courses}
      roomAssignments={roomAssignments}
      session={session}
    />
  );
}
