import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { ProgramsModule } from './programs/programs.module';
import { CoursesModule } from './courses/courses.module';
import { ExamsModule } from './exams/exams.module';
import { ScheduleModule } from './schedule/schedule.module';
import { RoomsModule } from './rooms/rooms.module';
import { InstructorsModule } from './instructors/instructors.module';
import { RoomAssignmentsModule } from './room-assignments/room-assignments.module';
import { SessionsModule } from './sessions/sessions.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, DepartmentsModule, ProgramsModule, CoursesModule, ExamsModule, ScheduleModule, RoomsModule, InstructorsModule, RoomAssignmentsModule, SessionsModule, RequestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
