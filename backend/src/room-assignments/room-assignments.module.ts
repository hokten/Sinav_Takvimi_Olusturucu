import { Module } from '@nestjs/common';
import { RoomAssignmentsController } from './room-assignments.controller';
import { RoomAssignmentsService } from './room-assignments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [PrismaModule, ScheduleModule],
  controllers: [RoomAssignmentsController],
  providers: [RoomAssignmentsService]
})
export class RoomAssignmentsModule {}
