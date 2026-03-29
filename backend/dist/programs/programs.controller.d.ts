import { ProgramsService } from './programs.service';
export declare class ProgramsController {
    private readonly programsService;
    constructor(programsService: ProgramsService);
    findAll(): Promise<{
        id: string;
        name: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        isSharedSource: boolean;
    }[]>;
    create(body: any): Promise<{
        id: string;
        name: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        isSharedSource: boolean;
    }>;
    update(id: string, body: any): Promise<{
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
