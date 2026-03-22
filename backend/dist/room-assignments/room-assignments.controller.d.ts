import { RoomAssignmentsService } from './room-assignments.service';
export declare class RoomAssignmentsController {
    private readonly service;
    constructor(service: RoomAssignmentsService);
    findAll(): Promise<{
        id: string;
        programId: string;
        roomId: string;
    }[]>;
    toggle(body: {
        roomId: string;
        programId: string;
    }): Promise<{
        action: string;
        assignment?: undefined;
    } | {
        action: string;
        assignment: {
            id: string;
            programId: string;
            roomId: string;
        };
    }>;
}
