import { PrismaService } from '../prisma/prisma.service';
export declare class ProgramsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        isSharedSource: boolean;
    }[]>;
    create(data: any): Promise<{
        id: string;
        name: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        isSharedSource: boolean;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        name: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        isSharedSource: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        isSharedSource: boolean;
    }>;
}
