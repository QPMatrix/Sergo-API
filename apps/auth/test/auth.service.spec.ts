import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/services/auth.service';
import { PrismaService } from '../src/auth/services/prisma.service';
import { RefreshTokenService } from '../src/auth/services/refresh-token.service';
import { KafkaService } from '../src/kafka/kafka.service';
import { RoleService } from '../src/auth/services/role.service';
import { AccountsService } from '../src/auth/services/accounts.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let refreshTokenService: RefreshTokenService;
  let kafkaService: KafkaService;

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
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
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
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            generateRefreshToken: jest.fn(),
            validateRefreshToken: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValueOnce(true);
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'test',
          phone: '1234567890',
          firstName: 'test',
          lastName: 'test',
          birthday: new Date(),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should register a new user and emit Kafka event', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        phone: '1234567890',
      };
      prismaService.user.findFirst = jest.fn().mockResolvedValueOnce(null);
      prismaService.user.create = jest.fn().mockResolvedValueOnce(mockUser);
      refreshTokenService.generateRefreshToken = jest
        .fn()
        .mockResolvedValueOnce('refresh_token');

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        firstName: 'test',
        lastName: 'test',
        birthday: new Date(),
      });

      expect(prismaService.user.create).toHaveBeenCalled();
      expect(kafkaService.emit).toHaveBeenCalledWith('user.registered', {
        userId: mockUser.id,
        email: mockUser.email,
        phone: mockUser.phone,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('validate', () => {
    it('should throw UnauthorizedException if user is not found or password is invalid', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValueOnce(null);
      await expect(
        authService.validate('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValueOnce(mockUser);

      const result = await authService.validate('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });
  });

  describe('localLogin', () => {
    it('should return access and refresh tokens', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      jwtService.sign = jest.fn().mockReturnValueOnce('access_token');
      refreshTokenService.generateRefreshToken = jest
        .fn()
        .mockResolvedValueOnce('refresh_token');

      const result = await authService.localLogin(mockUser);
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
      });
    });
  });

  describe('updateUser', () => {
    it('should update the user and emit Kafka event', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        phone: '1234567890',
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValueOnce(mockUser);
      prismaService.user.update = jest.fn().mockResolvedValueOnce(mockUser);

      const result = await authService.updateUser('1', {
        email: 'updated@example.com',
      });

      expect(prismaService.user.update).toHaveBeenCalled();
      expect(kafkaService.emit).toHaveBeenCalledWith('user.updated', {
        userId: mockUser.id,
        email: mockUser.email,
        phone: mockUser.phone,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValueOnce(null);
      await expect(
        authService.updateUser('1', { email: 'updated@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete the user and emit Kafka event', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        phone: '1234567890',
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValueOnce(mockUser);
      prismaService.user.delete = jest.fn().mockResolvedValueOnce(mockUser);

      const result = await authService.deleteUser('1');

      expect(prismaService.user.delete).toHaveBeenCalled();
      expect(kafkaService.emit).toHaveBeenCalledWith('user.deleted', {
        userId: mockUser.id,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValueOnce(null);
      await expect(authService.deleteUser('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new access and refresh tokens', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      refreshTokenService.validateRefreshToken = jest
        .fn()
        .mockResolvedValueOnce(mockUser);
      jwtService.sign = jest.fn().mockReturnValueOnce('new_access_token');
      refreshTokenService.generateRefreshToken = jest
        .fn()
        .mockResolvedValueOnce('new_refresh_token');

      const result = await authService.refreshToken('old_refresh_token');

      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      refreshTokenService.validateRefreshToken = jest
        .fn()
        .mockResolvedValueOnce(null);
      await expect(
        authService.refreshToken('invalid_refresh_token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
