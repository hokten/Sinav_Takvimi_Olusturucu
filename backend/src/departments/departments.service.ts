import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      include: { programs: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string }) {
    return this.prisma.department.create({ data });
  }

  async update(id: string, data: { name: string }) {
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(id: string) {
    const count = await this.prisma.program.count({ where: { departmentId: id } });
    if (count > 0) throw new BadRequestException('Bu bölüme ait programlar var. Önce onları silmelisiniz.');
    return this.prisma.department.delete({ where: { id } });
  }
}
