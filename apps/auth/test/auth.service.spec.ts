import { Test, TestingModule } from '@nestjs/testing';

import { JwtService } from '@nestjs/jwt';

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth.service';
import { PrismaService } from '../src/services/prisma.service';
import { RoleService } from '../src/services/role.service';
import { AccountsService } from '../src/services/accounts.service';
import { RefreshTokenService } from '../src/services/refresh-token.service';
import { CreateUserDto } from '../src/dto/create-user.dto';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let roleService: RoleService;
  let accountsService: AccountsService;
  let jwtService: JwtService;
  let refreshTokenService: RefreshTokenService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockRoleService = {
    assignRoleToUser: jest.fn(),
  };

  const mockAccountsService = {
    createAccount: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockRefreshTokenService = {
    generateRefreshToken: jest.fn(),
  };

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    phone: '1234567890',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    roleService = module.get<RoleService>(RoleService);
    accountsService = module.get<AccountsService>(AccountsService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'StrongPassword!1234',
        phone: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
        birthday: new Date('1990-01-01'),
      };
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.register(dto);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          password: 'hashed-password',
          phone: dto.phone,
        },
      });
      expect(roleService.assignRoleToUser).toHaveBeenCalledWith(
        mockUser.id,
        'CUSTOMER',
      );
      expect(accountsService.createAccount).toHaveBeenCalledWith(
        mockUser.id,
        'LOCAL',
        dto.email,
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'StrongPassword!1234',
        phone: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
        birthday: new Date('1990-01-01'),
      };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('validate', () => {
    it('should validate user credentials successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validate('test@example.com', 'password');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password',
        mockUser.password,
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validate('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validate('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('localLogin', () => {
    it('should log in a user successfully', async () => {
      const user = mockUser;
      const payload = { sub: user.id, username: user.email };
      mockJwtService.sign.mockReturnValue('jwt-token-here');
      mockRefreshTokenService.generateRefreshToken.mockResolvedValue(
        'refresh-token-here',
      );

      const result = await service.localLogin(user);

      expect(jwtService.sign).toHaveBeenCalledWith(payload);
      expect(refreshTokenService.generateRefreshToken).toHaveBeenCalledWith(
        user.id,
      );
      expect(result).toEqual({
        access_token: 'jwt-token-here',
        refresh_token: 'refresh-token-here',
      });
    });
  });

  describe('updateUser', () => {
    it('should update the user successfully', async () => {
      const updateData = { email: 'new@example.com', password: 'new-password' };
      const updatedUser = { ...mockUser, email: 'new@example.com' };
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(mockUser.id, updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith(updateData.password, 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          email: updateData.email,
          phone: undefined,
          password: 'new-hashed-password',
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update the user without changing password', async () => {
      const updateData = { email: 'new@example.com' };
      const updatedUser = { ...mockUser, email: 'new@example.com' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(mockUser.id, updateData);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          email: updateData.email,
          phone: undefined,
          password: undefined,
        },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete the user successfully', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser(mockUser.id);

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.delete.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(service.deleteUser(mockUser.id)).rejects.toThrow(
        'User not found',
      );
    });
  });
});
