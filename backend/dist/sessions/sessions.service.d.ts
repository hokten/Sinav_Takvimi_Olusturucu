import { PrismaService } from '../prisma/prisma.service';
export declare class SessionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        sessions: string[];
    }[]>;
    create(data: {
        date: string;
        sessions: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        sessions: string[];
    }>;
    update(id: string, sessions: string[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        sessions: string[];
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        sessions: string[];
    }>;
}
