import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from './schedule.gateway';
import { ScheduleService } from './schedule.service';
export declare class ScheduleController {
    private prisma;
    private gateway;
    private scheduleService;
    constructor(prisma: PrismaService, gateway: ScheduleGateway, scheduleService: ScheduleService);
    getScheduleData(req: any): Promise<{
        programs: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            color: string;
            isSharedSource: boolean;
            departmentId: string;
        }[];
        editableProgramIds: string[];
        sharedSourceProgramIds: string[];
        scheduleDays: {
            id: string;
            date: string;
            createdAt: Date;
            updatedAt: Date;
            sessions: string[];
        }[];
        exams: ({
            course: {
                instructor: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    mainProgramId: string;
                    sideProgramIds: string[];
                };
                program: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    color: string;
                    isSharedSource: boolean;
                    departmentId: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                instructorId: string;
                programId: string;
                name: string;
                code: string;
                section: number;
                grade: number;
                quota: number;
                adminOnly: boolean;
            };
            createdBy: {
                role: import(".prisma/client").$Enums.Role;
            };
            instructor: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                mainProgramId: string;
                sideProgramIds: string[];
            };
            program: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string;
                isSharedSource: boolean;
                departmentId: string;
            };
            deptSupervisors: {
                id: string;
                supervisorIds: string[];
                programId: string;
                examId: string;
            }[];
        } & {
            id: string;
            date: string;
            time: string;
            roomIds: string[];
            supervisorIds: string[];
            createdAt: Date;
            updatedAt: Date;
            isShared: boolean;
            courseId: string;
            instructorId: string;
            createdById: string;
            programId: string;
        })[];
        allExams: ({
            course: {
                instructor: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    mainProgramId: string;
                    sideProgramIds: string[];
                };
                program: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    color: string;
                    isSharedSource: boolean;
                    departmentId: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                instructorId: string;
                programId: string;
                name: string;
                code: string;
                section: number;
                grade: number;
                quota: number;
                adminOnly: boolean;
            };
            createdBy: {
                role: import(".prisma/client").$Enums.Role;
            };
            instructor: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                mainProgramId: string;
                sideProgramIds: string[];
            };
            program: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string;
                isSharedSource: boolean;
                departmentId: string;
            };
            deptSupervisors: {
                id: string;
                supervisorIds: string[];
                programId: string;
                examId: string;
            }[];
        } & {
            id: string;
            date: string;
            time: string;
            roomIds: string[];
            supervisorIds: string[];
            createdAt: Date;
            updatedAt: Date;
            isShared: boolean;
            courseId: string;
            instructorId: string;
            createdById: string;
            programId: string;
        })[];
        rooms: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            capacity: number;
        }[];
        instructors: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            mainProgramId: string;
            sideProgramIds: string[];
        }[];
        courses: ({
            instructor: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                mainProgramId: string;
                sideProgramIds: string[];
            };
            program: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                color: string;
                isSharedSource: boolean;
                departmentId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            instructorId: string;
            programId: string;
            name: string;
            code: string;
            section: number;
            grade: number;
            quota: number;
            adminOnly: boolean;
        })[];
        roomAssignments: {
            id: string;
            programId: string;
            roomId: string;
        }[];
        approvedReservations: never[];
        session: {
            user: any;
        };
    }>;
    checkSupervisorConflict(supervisorName: string, date: string, time: string, excludeExamId?: string): Promise<{
        conflict: boolean;
        message: string;
    } | {
        conflict: boolean;
        message?: undefined;
    }>;
    createExam(body: any, req: any): Promise<{
        id: string;
        date: string;
        time: string;
        roomIds: string[];
        supervisorIds: string[];
        createdAt: Date;
        updatedAt: Date;
        isShared: boolean;
        courseId: string;
        instructorId: string;
        createdById: string;
        programId: string;
    }>;
    updateExam(id: string, body: any, req: any): Promise<{
        id: string;
        date: string;
        time: string;
        roomIds: string[];
        supervisorIds: string[];
        createdAt: Date;
        updatedAt: Date;
        isShared: boolean;
        courseId: string;
        instructorId: string;
        createdById: string;
        programId: string;
    }>;
    deleteExam(id: string, req: any): Promise<{
        success: boolean;
    }>;
    updateSharedSupervisors(id: string, body: any, req: any): Promise<{
        success: boolean;
    }>;
    assignSupervisorsToAdminExam(id: string, body: any, req: any): Promise<{
        success: boolean;
    }>;
}
