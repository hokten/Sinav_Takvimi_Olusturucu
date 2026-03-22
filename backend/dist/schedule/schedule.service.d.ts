import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from './schedule.gateway';
export declare class ScheduleService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: ScheduleGateway);
    validateExam(id: string | null, body: any, user: any): Promise<void>;
    createExam(body: any, user: any): Promise<{
        id: string;
        date: string;
        time: string;
        roomIds: string[];
        supervisorIds: string[];
        isShared: boolean;
        createdAt: Date;
        updatedAt: Date;
        courseId: string;
        instructorId: string;
        programId: string;
        createdById: string;
    }>;
    updateExam(id: string, body: any, user: any): Promise<{
        id: string;
        date: string;
        time: string;
        roomIds: string[];
        supervisorIds: string[];
        isShared: boolean;
        createdAt: Date;
        updatedAt: Date;
        courseId: string;
        instructorId: string;
        programId: string;
        createdById: string;
    }>;
    deleteExam(id: string, user: any): Promise<{
        success: boolean;
    }>;
}
