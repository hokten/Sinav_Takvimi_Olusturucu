import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';
export declare class RequestsService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: ScheduleGateway);
    findAll(userRole: string, userProgramIds: string[]): Promise<{
        id: string;
        fromProgramId: string;
        roomId: string;
        date: string;
        time: string;
        status: import(".prisma/client").$Enums.SlotRequestStatus;
        fromProgram: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
            color: string;
            isSharedSource: boolean;
        };
        room: {
            assignments: ({
                program: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    departmentId: string;
                    color: string;
                    isSharedSource: boolean;
                };
            } & {
                id: string;
                programId: string;
                roomId: string;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            capacity: number;
        };
        ownerProgramIds: string[];
        ownerPrograms: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
            color: string;
            isSharedSource: boolean;
        }[];
        approvals: ({
            program: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                departmentId: string;
                color: string;
                isSharedSource: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            programId: string;
            slotRequestId: string;
            approved: boolean;
        })[];
    }[]>;
    create(data: {
        programId: string;
        roomId: string;
        date: string;
        time: string;
    }, userRole: string, userProgramIds: string[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        time: string;
        fromProgramId: string;
        roomId: string;
        status: import(".prisma/client").$Enums.SlotRequestStatus;
    }>;
    approve(id: string, userProgramIds: string[], userRole: string): Promise<{
        success: boolean;
    }>;
    reject(id: string, userProgramIds: string[], userRole: string): Promise<{
        success: boolean;
    }>;
    withdraw(id: string, userProgramIds: string[], userRole: string): Promise<{
        success: boolean;
    }>;
}
