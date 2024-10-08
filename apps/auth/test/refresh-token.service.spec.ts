import { Test, TestingModule } from '@nestjs/testing';

import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from '../src/auth/services/refresh-token.service';
import { PrismaService } from '../src/auth/services/prisma.service';

describe('RefreshTokenService', () => {
  let refreshTokenService: RefreshTokenService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('generateRefreshToken', () => {
    it('should generate a new refresh token', async () => {
      jwtService.sign = jest.fn().mockReturnValueOnce('new_refresh_token');
      prismaService.refreshToken.create = jest.fn().mockResolvedValueOnce(true);

      const result = await refreshTokenService.generateRefreshToken('1');
      expect(result).toEqual('new_refresh_token');
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a refresh token and return the user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      prismaService.refreshToken.findUnique = jest
        .fn()
        .mockResolvedValueOnce({ user: mockUser });

      const result =
        await refreshTokenService.validateRefreshToken('valid_token');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      prismaService.refreshToken.findUnique = jest
        .fn()
        .mockResolvedValueOnce(null);
      await expect(
        refreshTokenService.validateRefreshToken('invalid_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      prismaService.refreshToken.findUnique = jest.fn().mockResolvedValueOnce({
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(
        refreshTokenService.validateRefreshToken('expired_token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
