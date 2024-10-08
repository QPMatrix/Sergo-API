import { AuthService } from '../src/auth.service';
import { PrismaService } from '../src/services/prisma.service';
import { RoleService } from '../src/services/role.service';
import { AccountsService } from '../src/services/accounts.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateUserDto } from '../src/dto/create-user.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let roleService: RoleService;
  let accountsService: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: RoleService,
          useValue: {
            assignRoleToUser: jest.fn(),
          },
        },
        {
          provide: AccountsService,
          useValue: {
            createAccount: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    roleService = module.get<RoleService>(RoleService);
    accountsService = module.get<AccountsService>(AccountsService);
  });
  //AuthService should be defined
  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
  //Register function
  describe('register', () => {
    it('should throw a ConflictException if the user already exists', async () => {
      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValueOnce({ email: 'test@example.com' });
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password',
          phone: null,
        } as CreateUserDto),
      ).rejects.toThrow(ConflictException);
    });
  });
  it('should create a user, assign a role, and create an account', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      password: 'password',
    };
    prismaService.user.findFirst = jest.fn().mockResolvedValueOnce(null);
    prismaService.user.create = jest.fn().mockResolvedValueOnce(mockUser);
    roleService.assignRoleToUser = jest.fn().mockResolvedValueOnce(true);
    accountsService.createAccount = jest.fn().mockResolvedValueOnce(true);
    const result = await authService.register({
      email: 'test@example.com',
      password: 'password',
      phone: null,
    } as CreateUserDto);
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: expect.any(String),
        phone: null,
      },
    });
    expect(roleService.assignRoleToUser).toHaveBeenCalledWith('1', 'CUSTOMER');
    expect(accountsService.createAccount).toHaveBeenCalledWith(
      '1',
      'LOCAL',
      'test@example.com',
    );
    expect(result).toEqual(mockUser);
  });
});
