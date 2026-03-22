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
            name: string;
            color: string;
            isSharedSource: boolean;
            departmentId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        editableProgramIds: string[];
        sharedSourceProgramIds: string[];
        scheduleDays: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            date: string;
            sessions: string[];
        }[];
        exams: ({
            program: {
                id: string;
                name: string;
                color: string;
                isSharedSource: boolean;
                departmentId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            course: {
                program: {
                    id: string;
                    name: string;
                    color: string;
                    isSharedSource: boolean;
                    departmentId: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                instructor: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    mainProgramId: string;
                    sideProgramIds: string[];
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                instructorId: string;
                programId: string;
                code: string;
                section: number;
                grade: number;
                quota: number;
                adminOnly: boolean;
            };
            instructor: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                mainProgramId: string;
                sideProgramIds: string[];
            };
            createdBy: {
                role: import(".prisma/client").$Enums.Role;
            };
            deptSupervisors: {
                id: string;
                supervisorIds: string[];
                programId: string;
                examId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            date: string;
            courseId: string;
            time: string;
            roomIds: string[];
            supervisorIds: string[];
            instructorId: string;
            programId: string;
            isShared: boolean;
            createdById: string;
        })[];
        allExams: ({
            program: {
                id: string;
                name: string;
                color: string;
                isSharedSource: boolean;
                departmentId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            course: {
                program: {
                    id: string;
                    name: string;
                    color: string;
                    isSharedSource: boolean;
                    departmentId: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
                instructor: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    mainProgramId: string;
                    sideProgramIds: string[];
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                instructorId: string;
                programId: string;
                code: string;
                section: number;
                grade: number;
                quota: number;
                adminOnly: boolean;
            };
            instructor: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                mainProgramId: string;
                sideProgramIds: string[];
            };
            createdBy: {
                role: import(".prisma/client").$Enums.Role;
            };
            deptSupervisors: {
                id: string;
                supervisorIds: string[];
                programId: string;
                examId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            date: string;
            courseId: string;
            time: string;
            roomIds: string[];
            supervisorIds: string[];
            instructorId: string;
            programId: string;
            isShared: boolean;
            createdById: string;
        })[];
        rooms: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            capacity: number;
        }[];
        instructors: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            mainProgramId: string;
            sideProgramIds: string[];
        }[];
        courses: ({
            program: {
                id: string;
                name: string;
                color: string;
                isSharedSource: boolean;
                departmentId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            instructor: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                mainProgramId: string;
                sideProgramIds: string[];
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            instructorId: string;
            programId: string;
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
        createdAt: Date;
        updatedAt: Date;
        date: string;
        courseId: string;
        time: string;
        roomIds: string[];
        supervisorIds: string[];
        instructorId: string;
        programId: string;
        isShared: boolean;
        createdById: string;
    }>;
    updateExam(id: string, body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        courseId: string;
        time: string;
        roomIds: string[];
        supervisorIds: string[];
        instructorId: string;
        programId: string;
        isShared: boolean;
        createdById: string;
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
