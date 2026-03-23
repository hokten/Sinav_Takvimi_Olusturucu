import { CoursesService } from './courses.service';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
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
    create(body: any): Promise<{
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
    importCourses(body: {
        rows: any[];
    }): Promise<{
        created: number;
        skipped: number;
        errors: string[];
    }>;
    update(id: string, body: any): Promise<{
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
}
