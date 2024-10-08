import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProviderType } from '.prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}
  // Create a new account for the user with the specified provider
  async createAccount(
    userId: string,
    provider: ProviderType,
    providerAccountId: string,
  ) {
    return this.prisma.account.create({
      data: {
        userId,
        provider,
        providerAccountId,
      },
    });
  }
  // Find all accounts by user ID
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
  // Find a specific account by userId and provider
  async getAccountsByUserId(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
    });

    if (!accounts.length) {
      throw new NotFoundException(
        `No accounts found for user with ID ${userId}`,
      );
    }

    return accounts;
  }
  // Update the provider account ID for a specific provider
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
}
