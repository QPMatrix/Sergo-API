import { AccountsService } from '../src/services/accounts.service';
import { PrismaService } from '../src/services/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

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
            },
          },
        },
      ],
    }).compile();
    accountsService = module.get<AccountsService>(AccountsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(accountsService).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create a new account', async () => {
      const mockAccount = {
        userId: '123',
        provider: 'LOCAL',
        providerAccountId: 'test@example.com',
      };
      prisma.account.create = jest.fn().mockResolvedValueOnce(mockAccount);
      const result = await accountsService.createAccount(
        '123',
        'LOCAL',
        'test@example.com',
      );
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: mockAccount,
      });
      expect(result).toEqual(mockAccount);
    });
  });
  describe('getAccountByProvider', () => {
    it('should throw NotFoundException if no account is found', async () => {
      prisma.account.findFirst = jest.fn().mockResolvedValueOnce(null);

      await expect(
        accountsService.getAccountByProvider('123', 'LOCAL'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return the account if found', async () => {
      const mockAccount = {
        userId: '123',
        provider: 'LOCAL',
        providerAccountId: 'test@example.com',
      };
      prisma.account.findFirst = jest.fn().mockResolvedValueOnce(mockAccount);

      const result = await accountsService.getAccountByProvider('123', 'LOCAL');
      expect(result).toEqual(mockAccount);
    });
  });
});
