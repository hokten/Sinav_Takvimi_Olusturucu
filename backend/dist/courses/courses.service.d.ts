import { PrismaService } from '../prisma/prisma.service';
export declare class CoursesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        program: {
            id: string;
            name: string;
            departmentId: string;
            createdAt: Date;
            updatedAt: Date;
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
        instructorId: string;
        adminOnly: boolean;
        programId: string;
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
        instructorId: string;
        adminOnly: boolean;
        programId: string;
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
        instructorId: string;
        adminOnly: boolean;
        programId: string;
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
        instructorId: string;
        adminOnly: boolean;
        programId: string;
    }>;
    importCourses(rows: any[]): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
}
