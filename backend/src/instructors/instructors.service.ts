import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstructorsService {
  constructor(private prisma: PrismaService) {}

  async getStats(user: any) {
    const isAdmin = user.role === 'ADMIN';
    const userProgramIds = user.programIds || [];

    const instructors = isAdmin
      ? await this.prisma.instructor.findMany({ include: { mainProgram: true } })
      : await this.prisma.instructor.findMany({
          where: {
            OR: userProgramIds.flatMap((id: string) => [
              { mainProgramId: id },
              { sideProgramIds: { has: id } },
            ]),
          },
          include: { mainProgram: true },
        });

    const programs = await this.prisma.program.findMany();

    const exams = await this.prisma.exam.findMany({
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

    const programMap: Record<string, any> = Object.fromEntries(programs.map((p) => [p.id, p]));

    return instructors.map((inst) => ({
      id: inst.id,
      name: inst.name,
      mainProgramName: inst.mainProgram.name,
      mainProgramColor: inst.mainProgram.color,
      sideProgramNames: inst.sideProgramIds.map((id) => programMap[id]?.name ?? ''),
      examCount: examCountMap[inst.id] ?? 0,
      supervisorCount: supervisorCountMap[inst.id] ?? 0,
    }));
  }

  async findAll() { 
    return this.prisma.instructor.findMany({ 
      include: { mainProgram: true },
      orderBy: { name: 'asc' } 
    }); 
  }
  
  async create(data: { name: string, mainProgramId: string, sideProgramIds: string[] }) { 
    return this.prisma.instructor.create({ data }); 
  }
  
  async update(id: string, data: { name: string, mainProgramId: string, sideProgramIds: string[] }) { 
    return this.prisma.instructor.update({ where: { id }, data }); 
  }
  
  async remove(id: string) { 
    return this.prisma.instructor.delete({ where: { id } }); 
  }
}
