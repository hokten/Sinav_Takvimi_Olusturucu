import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { programs: { include: { program: true } } }
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { programs: { include: { program: true } } }
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { programs: { include: { program: { include: { department: true } } } } },
      orderBy: { name: 'asc' }
    });
  }

  async create(data: any) {
    const { departmentId, ...userData } = data;
    const user = await this.prisma.user.create({ data: userData });
    
    if (departmentId && userData.role === 'DEPT_HEAD') {
      const programs = await this.prisma.program.findMany({ where: { departmentId } });
      if (programs.length > 0) {
        await this.prisma.userProgram.createMany({
          data: programs.map(p => ({ userId: user.id, programId: p.id, type: 'MAIN' as const }))
        });
      }
    }
    return user;
  }

  async update(id: string, data: any) {
    const { departmentId, ...userData } = data;
    const user = await this.prisma.user.update({ where: { id }, data: userData });

    if (userData.role === 'ADMIN') {
      await this.prisma.userProgram.deleteMany({ where: { userId: id } });
    } else if (departmentId && userData.role === 'DEPT_HEAD') {
      await this.prisma.userProgram.deleteMany({ where: { userId: id } });
      const programs = await this.prisma.program.findMany({ where: { departmentId } });
      if (programs.length > 0) {
        await this.prisma.userProgram.createMany({
          data: programs.map(p => ({ userId: user.id, programId: p.id, type: 'MAIN' as const }))
        });
      }
    }
    return user;
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
