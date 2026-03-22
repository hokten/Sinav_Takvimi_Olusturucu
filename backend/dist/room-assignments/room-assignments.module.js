"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomAssignmentsModule = void 0;
const common_1 = require("@nestjs/common");
const room_assignments_controller_1 = require("./room-assignments.controller");
const room_assignments_service_1 = require("./room-assignments.service");
const prisma_module_1 = require("../prisma/prisma.module");
const schedule_module_1 = require("../schedule/schedule.module");
let RoomAssignmentsModule = class RoomAssignmentsModule {
};
exports.RoomAssignmentsModule = RoomAssignmentsModule;
exports.RoomAssignmentsModule = RoomAssignmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, schedule_module_1.ScheduleModule],
        controllers: [room_assignments_controller_1.RoomAssignmentsController],
        providers: [room_assignments_service_1.RoomAssignmentsService]
    })
], RoomAssignmentsModule);
//# sourceMappingURL=room-assignments.module.js.map