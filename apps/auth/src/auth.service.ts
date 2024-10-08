import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from './services/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RoleService } from './services/role.service';
import { AccountsService } from './services/accounts.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly accountsService: AccountsService,
  ) {}

  async register(data: CreateUserDto) {
    const { email, password, phone } = data;
    try {
      const isUserExists = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { phone }],
        },
      });
      if (isUserExists) {
        throw new ConflictException('User already exists'); //409
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,
        },
      });
      await this.roleService.assignRoleToUser(user.id, 'CUSTOMER');
      await this.accountsService.createAccount(user.id, 'LOCAL', email);
      // TODO: Send email verification + communicate with customer servers and profile servers
      return user;
    } catch (e) {
      throw e;
    }
  }
}
