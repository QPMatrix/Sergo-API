import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { AccountsService } from '../src/auth/services/accounts.service';
import { PrismaService } from '../src/auth/services/prisma.service';

describe('AccountsService', () => {
  let accountsService: AccountsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: {
            account: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    accountsService = module.get<AccountsService>(AccountsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createAccount', () => {
    it('should create a new account', async () => {
      const mockAccount = {
        userId: '1',
        provider: 'LOCAL',
        providerAccountId: 'test@example.com',
      };
      prisma.account.create = jest.fn().mockResolvedValueOnce(mockAccount);

      const result = await accountsService.createAccount(
        '1',
        'LOCAL',
        'test@example.com',
      );
      expect(result).toEqual(mockAccount);
    });
  });

  describe('getAccountByProvider', () => {
    it('should throw NotFoundException if no account is found', async () => {
      prisma.account.findFirst = jest.fn().mockResolvedValueOnce(null);
      await expect(
        accountsService.getAccountByProvider('1', 'LOCAL'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return the account if found', async () => {
      const mockAccount = {
        userId: '1',
        provider: 'LOCAL',
        providerAccountId: 'test@example.com',
      };
      prisma.account.findFirst = jest.fn().mockResolvedValueOnce(mockAccount);

      const result = await accountsService.getAccountByProvider('1', 'LOCAL');
      expect(result).toEqual(mockAccount);
    });
  });

  describe('getAccountsByUserId', () => {
    it('should return accounts if they exist', async () => {
      const mockAccounts = [{ userId: '1', provider: 'LOCAL' }];
      prisma.account.findMany = jest.fn().mockResolvedValueOnce(mockAccounts);

      const result = await accountsService.getAccountsByUserId('1');
      expect(result).toEqual(mockAccounts);
    });

    it('should throw NotFoundException if no accounts are found', async () => {
      prisma.account.findMany = jest.fn().mockResolvedValueOnce([]);
      await expect(accountsService.getAccountsByUserId('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAccountProviderId', () => {
    it('should update account provider ID', async () => {
      const mockAccount = { count: 1 };
      prisma.account.updateMany = jest.fn().mockResolvedValueOnce(mockAccount);

      const result = await accountsService.updateAccountProviderId(
        '1',
        'LOCAL',
        'new_provider_account',
      );
      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException if no account is found', async () => {
      prisma.account.updateMany = jest.fn().mockResolvedValueOnce({ count: 0 });
      await expect(
        accountsService.updateAccountProviderId(
          '1',
          'LOCAL',
          'new_provider_account',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete the account', async () => {
      prisma.account.deleteMany = jest.fn().mockResolvedValueOnce({ count: 1 });
      const result = await accountsService.deleteAccount('1', 'LOCAL');
      expect(result).toEqual({ count: 1 });
    });
  });
});
