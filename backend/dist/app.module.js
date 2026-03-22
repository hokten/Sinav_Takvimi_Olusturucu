"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const departments_module_1 = require("./departments/departments.module");
const programs_module_1 = require("./programs/programs.module");
const courses_module_1 = require("./courses/courses.module");
const exams_module_1 = require("./exams/exams.module");
const schedule_module_1 = require("./schedule/schedule.module");
const rooms_module_1 = require("./rooms/rooms.module");
const instructors_module_1 = require("./instructors/instructors.module");
const room_assignments_module_1 = require("./room-assignments/room-assignments.module");
const sessions_module_1 = require("./sessions/sessions.module");
const requests_module_1 = require("./requests/requests.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, users_module_1.UsersModule, auth_module_1.AuthModule, departments_module_1.DepartmentsModule, programs_module_1.ProgramsModule, courses_module_1.CoursesModule, exams_module_1.ExamsModule, schedule_module_1.ScheduleModule, rooms_module_1.RoomsModule, instructors_module_1.InstructorsModule, room_assignments_module_1.RoomAssignmentsModule, sessions_module_1.SessionsModule, requests_module_1.RequestsModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map