import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, (user as any).password))) { // Added (user as any) for password access
      const userData = user as any;
      // Lazy sync departmentId if missing for existing DEPT_HEAD users
      if (userData.role === 'DEPT_HEAD' && !userData.departmentId && userData.programs?.length > 0) {
        const mainProg = userData.programs.find((p: any) => p.type === 'MAIN') || userData.programs[0];
        const deptId = mainProg.program?.departmentId;
        if (deptId) {
          await this.usersService.updateDepartmentId(userData.id, deptId);
          userData.departmentId = deptId;
        }
      }
      const { password, ...result } = userData;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role, 
      departmentId: user.departmentId,
      programIds: user.programs?.map((p: any) => p.programId) || [] 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: { ...user, programIds: payload.programIds },
    };
  }
}
