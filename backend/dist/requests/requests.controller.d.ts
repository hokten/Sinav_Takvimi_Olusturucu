import { RequestsService } from './requests.service';
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    findAll(req: any): Promise<{
        id: string;
        fromProgramId: string;
        roomId: string;
        date: string;
        time: string;
        status: import(".prisma/client").$Enums.SlotRequestStatus;
        fromProgram: {
            id: string;
            name: string;
            departmentId: string;
            createdAt: Date;
            updatedAt: Date;
            color: string;
            isSharedSource: boolean;
        };
        room: {
            assignments: ({
                program: {
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
                programId: string;
                roomId: string;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            capacity: number;
        };
        ownerProgramIds: string[];
        ownerPrograms: {
            id: string;
            name: string;
            departmentId: string;
            createdAt: Date;
            updatedAt: Date;
            color: string;
            isSharedSource: boolean;
        }[];
        approvals: ({
            program: {
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
            createdAt: Date;
            updatedAt: Date;
            programId: string;
            slotRequestId: string;
            approved: boolean;
        })[];
    }[]>;
    create(body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        time: string;
        roomId: string;
        status: import(".prisma/client").$Enums.SlotRequestStatus;
        fromProgramId: string;
    }>;
    approve(id: string, req: any): Promise<{
        success: boolean;
    }>;
    reject(id: string, req: any): Promise<{
        success: boolean;
    }>;
    withdraw(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
