import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';

@Injectable()
export class RoomAssignmentsService {
  constructor(
    private prisma: PrismaService,
    private gateway: ScheduleGateway,
  ) {}

  async findAll() {
    return this.prisma.roomAssignment.findMany();
  }

  async toggle(roomId: string, programId: string) {
    const existing = await this.prisma.roomAssignment.findUnique({
      where: { roomId_programId: { roomId, programId } },
    });

    let result;
    if (existing) {
      await this.prisma.roomAssignment.delete({
        where: { id: existing.id },
      });
      result = { action: 'removed' };
    } else {
      const assignment = await this.prisma.roomAssignment.create({
        data: { roomId, programId },
      });
      result = { action: 'added', assignment };
    }
    this.gateway.notifyScheduleUpdate();
    return result;
  }
}
