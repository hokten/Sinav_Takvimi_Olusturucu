import { InstructorsService } from './instructors.service';
export declare class InstructorsController {
    private readonly instructorsService;
    constructor(instructorsService: InstructorsService);
    getStats(req: any): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
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
    create(body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        mainProgramId: string;
        sideProgramIds: string[];
    }>;
    update(id: string, body: any): Promise<{
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
