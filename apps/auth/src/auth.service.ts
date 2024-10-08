import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from './services/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RoleService } from './services/role.service';
import { AccountsService } from './services/accounts.service';
import { User } from '.prisma/client';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
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
  async validate(username: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: username },
      include: {
        roleAssignments: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
  async localLogin(user: any) {
    const payload = { sub: user.id, username: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
