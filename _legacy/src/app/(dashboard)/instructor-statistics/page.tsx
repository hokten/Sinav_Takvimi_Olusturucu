import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { InstructorStatisticsView } from "@/components/program/InstructorStatisticsView";

export default async function InstructorStatisticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const userProgramIds = session.user.programIds ?? [];

  const instructors = isAdmin
    ? await prisma.instructor.findMany({ include: { mainProgram: true } })
    : await prisma.instructor.findMany({
        where: {
          OR: userProgramIds.flatMap((id) => [
            { mainProgramId: id },
            { sideProgramIds: { has: id } },
          ]),
        },
        include: { mainProgram: true },
      });

  const programs = await prisma.program.findMany();

  const exams = await prisma.exam.findMany({
    include: { deptSupervisors: true },
  });

  const examCountMap: Record<string, number> = {};
  const supervisorCountMap: Record<string, number> = {};

  for (const exam of exams) {
    examCountMap[exam.instructorId] = (examCountMap[exam.instructorId] ?? 0) + 1;

    const allSupervisors = new Set([
      ...exam.supervisorIds,
      ...exam.deptSupervisors.flatMap((ds) => ds.supervisorIds),
    ]);
    for (const sid of allSupervisors) {
      supervisorCountMap[sid] = (supervisorCountMap[sid] ?? 0) + 1;
    }
  }

  const programMap = Object.fromEntries(programs.map((p) => [p.id, p]));

  const stats = instructors.map((inst) => ({
    id: inst.id,
    name: inst.name,
    mainProgramName: inst.mainProgram.name,
    mainProgramColor: inst.mainProgram.color,
    sideProgramNames: inst.sideProgramIds.map((id) => programMap[id]?.name ?? ""),
    examCount: examCountMap[inst.id] ?? 0,
    supervisorCount: supervisorCountMap[inst.id] ?? 0,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Öğretim Elemanı İstatistikleri
      </h1>
      <InstructorStatisticsView stats={stats} />
    </div>
  );
}
