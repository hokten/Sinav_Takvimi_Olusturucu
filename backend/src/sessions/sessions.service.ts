import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.scheduleDay.findMany({ orderBy: { date: 'asc' } });
  }

  async create(data: { date: string, sessions: string[] }) {
    return this.prisma.scheduleDay.create({ data });
  }

  async update(id: string, sessions: string[]) {
    return this.prisma.scheduleDay.update({
      where: { id },
      data: { sessions },
    });
  }

  async remove(id: string) {
    return this.prisma.scheduleDay.delete({ where: { id } });
  }
}
