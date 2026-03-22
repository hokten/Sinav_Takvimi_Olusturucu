import { PrismaService } from '../prisma/prisma.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';
export declare class RoomAssignmentsService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: ScheduleGateway);
    findAll(): Promise<{
        id: string;
        programId: string;
        roomId: string;
    }[]>;
    toggle(roomId: string, programId: string): Promise<{
        action: string;
        assignment?: undefined;
    } | {
        action: string;
        assignment: {
            id: string;
            programId: string;
            roomId: string;
        };
    }>;
}
