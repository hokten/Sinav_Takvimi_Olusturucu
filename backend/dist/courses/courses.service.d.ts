import { PrismaService } from '../prisma/prisma.service';
export declare class CoursesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        instructor: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            mainProgramId: string;
            sideProgramIds: string[];
        };
        program: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            color: string;
            isSharedSource: boolean;
            departmentId: string;
        };
    } & {
        id: string;
        code: string;
        name: string;
        section: number;
        grade: number;
        quota: number;
        instructorId: string;
        adminOnly: boolean;
        createdAt: Date;
        updatedAt: Date;
        programId: string;
    })[]>;
    create(data: any): Promise<{
        id: string;
        code: string;
        name: string;
        section: number;
        grade: number;
        quota: number;
        instructorId: string;
        adminOnly: boolean;
        createdAt: Date;
        updatedAt: Date;
        programId: string;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        code: string;
        name: string;
        section: number;
        grade: number;
        quota: number;
        instructorId: string;
        adminOnly: boolean;
        createdAt: Date;
        updatedAt: Date;
        programId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        section: number;
        grade: number;
        quota: number;
        instructorId: string;
        adminOnly: boolean;
        createdAt: Date;
        updatedAt: Date;
        programId: string;
    }>;
    importCourses(rows: any[]): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
}
