import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProviderType } from '.prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(
    userId: string,
    provider: ProviderType,
    providerAccountId: string,
  ) {
    return this.prisma.account.create({
      data: { userId, provider, providerAccountId },
    });
  }

  async getAccountByProvider(userId: string, provider: ProviderType) {
    const account = await this.prisma.account.findFirst({
      where: { userId, provider },
    });
    if (!account) {
      throw new NotFoundException(
        `Account with provider ${provider} not found for user ${userId}`,
      );
    }
    return account;
  }

  async getAccountsByUserId(userId: string) {
    const accounts = await this.prisma.account.findMany({ where: { userId } });
    if (!accounts.length) {
      throw new NotFoundException(
        `No accounts found for user with ID ${userId}`,
      );
    }
    return accounts;
  }

  async updateAccountProviderId(
    userId: string,
    provider: ProviderType,
    newProviderAccountId: string,
  ) {
    const account = await this.prisma.account.updateMany({
      where: { userId, provider },
      data: { providerAccountId: newProviderAccountId },
    });
    if (account.count === 0) {
      throw new NotFoundException(
        `Account with provider ${provider} not found for user ${userId}`,
      );
    }
    return account;
  }

  async deleteAccount(userId: string, provider: ProviderType) {
    return this.prisma.account.deleteMany({ where: { userId, provider } });
  }
}
