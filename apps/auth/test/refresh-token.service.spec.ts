import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from '../src/services/refresh-token.service';
import { PrismaService } from '../src/services/prisma.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    refreshToken: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
  };

  const mockToken = {
    token: 'refresh-token',
    userId: 'user-id',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generateRefreshToken', () => {
    it('should return existing refresh token if it exists', async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(mockToken);

      const result = await service.generateRefreshToken('user-id');

      expect(prismaService.refreshToken.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
      });
      expect(result).toEqual(mockToken.token);
    });

    it('should generate new refresh token if none exists', async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);
      // Cast jwtService.sign as jest.Mock
      (jwtService.sign as jest.Mock).mockReturnValue('new-refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        token: 'new-refresh-token',
      });

      const result = await service.generateRefreshToken('user-id');

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-id' },
        { expiresIn: '7d' },
      );
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
      expect(result).toEqual('new-refresh-token');
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate refresh token successfully', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.validateRefreshToken('refresh-token');

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'refresh-token' },
        include: { user: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if token not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.validateRefreshToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token expired', async () => {
      mockToken.expiresAt = new Date(Date.now() - 1000); // expired
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockToken);

      await expect(
        service.validateRefreshToken('refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      // Cast jwtService.sign as jest.Mock
      (jwtService.sign as jest.Mock).mockReturnValue('new-access-token');
      service.generateRefreshToken = jest
        .fn()
        .mockResolvedValue('new-refresh-token');

      const result = await service.refreshToken('user-id');

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-id' });
      expect(service.generateRefreshToken).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
    });
  });
});
