import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        sessions: string[];
    }[]>;
    create(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        sessions: string[];
    }>;
    update(id: string, sessions: string[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        sessions: string[];
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: string;
        sessions: string[];
    }>;
}
