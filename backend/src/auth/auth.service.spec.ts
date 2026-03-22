import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmail: jest.fn() }
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() }
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('bilgiler doğruysa kullanıcıyı şifre olmadan döndürmeli', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({ id: 'u1', password: 'hashed_password' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password123');
      expect(result).toEqual({ id: 'u1' });
      expect(result.password).toBeUndefined();
    });

    it('şifre hatalıysa null döndürmeli', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({ id: 'u1', password: 'hashed_password' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@test.com', 'wrong');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('JWT payload içeriğinde kullanıcının programlarını düzgün şekilde programIds olarak eşlemeli', async () => {
      const user = {
        id: 'user1',
        email: 'admin@test.com',
        role: 'DEPT_HEAD',
        programs: [
          { programId: 'progA' },
          { programId: 'progB' }
        ]
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('mock_jwt_token');

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
        sub: 'user1',
        programIds: ['progA', 'progB']
      }));

      expect(result.access_token).toBe('mock_jwt_token');
      expect(result.user.programIds).toEqual(['progA', 'progB']);
    });
  });
});
