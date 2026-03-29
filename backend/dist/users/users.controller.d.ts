import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<({
        programs: ({
            program: {
                department: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
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
            userId: string;
            type: import(".prisma/client").$Enums.UserProgramType;
            programId: string;
        })[];
    } & {
        id: string;
        email: string;
        name: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    create(body: any): Promise<{
        id: string;
        email: string;
        name: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, body: any): Promise<{
        id: string;
        email: string;
        name: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
