import { PrismaService } from '../prisma/prisma.service';
export declare class InstructorsService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(user: any): Promise<{
        id: string;
        name: string;
        mainProgramName: string;
        mainProgramColor: string;
        sideProgramNames: any[];
        examCount: number;
        supervisorCount: number;
    }[]>;
    findAll(): Promise<({
        mainProgram: {
            id: string;
            name: string;
            departmentId: string;
            createdAt: Date;
            updatedAt: Date;
            color: string;
            isSharedSource: boolean;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mainProgramId: string;
        sideProgramIds: string[];
    })[]>;
    create(data: {
        name: string;
        mainProgramId: string;
        sideProgramIds: string[];
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mainProgramId: string;
        sideProgramIds: string[];
    }>;
    update(id: string, data: {
        name: string;
        mainProgramId: string;
        sideProgramIds: string[];
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mainProgramId: string;
        sideProgramIds: string[];
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mainProgramId: string;
        sideProgramIds: string[];
    }>;
}
