import { CoursesService } from './courses.service';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
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
    create(body: any): Promise<{
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
}
