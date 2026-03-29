import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<({
        programs: ({
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
    }) | null>;
    findById(id: string): Promise<({
        programs: ({
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
    }) | null>;
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
    create(data: any): Promise<{
        id: string;
        email: string;
        name: string;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: any): Promise<{
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
    updateDepartmentId(userId: string, departmentId: string): Promise<any>;
}
