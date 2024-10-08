import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { ProviderType } from '.prisma/client';
import { AccountsService } from '../src/services/accounts.service';
import { PrismaService } from '../src/services/prisma.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    account: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockAccount = {
    id: 'account-id',
    userId: 'user-id',
    provider: ProviderType.LOCAL,
    providerAccountId: 'provider-account-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createAccount', () => {
    it('should create an account successfully', async () => {
      mockPrismaService.account.create.mockResolvedValue(mockAccount);

      const result = await service.createAccount(
        'user-id',
        ProviderType.LOCAL,
        'provider-account-id',
      );

      expect(prismaService.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          provider: ProviderType.LOCAL,
          providerAccountId: 'provider-account-id',
        },
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('getAccountByProvider', () => {
    it('should get account by provider successfully', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(mockAccount);

      const result = await service.getAccountByProvider(
        'user-id',
        ProviderType.LOCAL,
      );

      expect(prismaService.account.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-id', provider: ProviderType.LOCAL },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(
        service.getAccountByProvider('user-id', ProviderType.LOCAL),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAccountsByUserId', () => {
    it('should get accounts by user ID successfully', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);

      const result = await service.getAccountsByUserId('user-id');

      expect(prismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
      });
      expect(result).toEqual([mockAccount]);
    });

    it('should throw NotFoundException if no accounts found', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([]);

      await expect(service.getAccountsByUserId('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAccountProviderId', () => {
    it('should update account provider ID successfully', async () => {
      mockPrismaService.account.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateAccountProviderId(
        'user-id',
        ProviderType.LOCAL,
        'new-provider-account-id',
      );

      expect(prismaService.account.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', provider: ProviderType.LOCAL },
        data: { providerAccountId: 'new-provider-account-id' },
      });
      expect(result).toEqual({ count: 1 });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateAccountProviderId(
          'user-id',
          ProviderType.LOCAL,
          'new-provider-account-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      mockPrismaService.account.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteAccount('user-id', ProviderType.LOCAL);

      expect(prismaService.account.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', provider: ProviderType.LOCAL },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
