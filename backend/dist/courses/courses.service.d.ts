import { PrismaService } from '../prisma/prisma.service';
export declare class CoursesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        program: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
            color: string;
            isSharedSource: boolean;
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
        code: string;
        section: number;
        grade: number;
        quota: number;
        programId: string;
        instructorId: string;
        adminOnly: boolean;
    })[]>;
    create(data: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        section: number;
        grade: number;
        quota: number;
        programId: string;
        instructorId: string;
        adminOnly: boolean;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        section: number;
        grade: number;
        quota: number;
        programId: string;
        instructorId: string;
        adminOnly: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        section: number;
        grade: number;
        quota: number;
        programId: string;
        instructorId: string;
        adminOnly: boolean;
    }>;
    importCourses(rows: any[]): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
}
