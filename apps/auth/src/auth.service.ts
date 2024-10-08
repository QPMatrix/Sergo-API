import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleService } from './services/role.service';
import { AccountsService } from './services/accounts.service';
import { RefreshTokenService } from './services/refresh-token.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(data: CreateUserDto) {
    const { email, password, phone } = data;
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) throw new ConflictException('User already exists');
    //TODO:: notify profile + customer server
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, phone },
    });

    await this.roleService.assignRoleToUser(user.id, 'CUSTOMER');
    await this.accountsService.createAccount(user.id, 'LOCAL', email);

    return user;
  }

  async validate(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: username },
    });
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async localLogin(user: any) {
    const payload = { sub: user.id, username: user.email };
    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user.id,
    );
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }

  async updateUser(id: string, updateData: Partial<CreateUserDto>) {
    //TODO:: notify profile + customer server

    return this.prisma.user.update({
      where: { id },
      data: {
        email: updateData.email,
        phone: updateData.phone,
        password: updateData.password
          ? await bcrypt.hash(updateData.password, 10)
          : undefined,
      },
    });
  }

  async deleteUser(id: string) {
    //TODO:: notify profile + customer server

    return this.prisma.user.delete({ where: { id } });
  }
}
