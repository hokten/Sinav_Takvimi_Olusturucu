import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.program.findMany({ orderBy: { name: 'asc' } });
  }

  async create(data: any) {
    return this.prisma.program.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.program.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.program.delete({ where: { id } });
  }
}
