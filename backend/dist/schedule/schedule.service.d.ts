import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from './schedule.gateway';
export declare class ScheduleService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: ScheduleGateway);
    validateExam(id: string | null, body: any, user: any): Promise<void>;
    createExam(body: any, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        time: string;
        programId: string;
        instructorId: string;
        courseId: string;
        roomIds: string[];
        supervisorIds: string[];
        isShared: boolean;
        createdById: string;
    }>;
    updateExam(id: string, body: any, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        time: string;
        programId: string;
        instructorId: string;
        courseId: string;
        roomIds: string[];
        supervisorIds: string[];
        isShared: boolean;
        createdById: string;
    }>;
    deleteExam(id: string, user: any): Promise<{
        success: boolean;
    }>;
}
