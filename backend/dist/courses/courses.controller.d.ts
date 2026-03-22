import { CoursesService } from './courses.service';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
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
    create(body: any): Promise<{
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
    importCourses(body: {
        rows: any[];
    }): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
    update(id: string, body: any): Promise<{
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
}
