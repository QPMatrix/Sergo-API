import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../dto/create-user.dto';
import { RoleService } from './role.service';
import { AccountsService } from './accounts.service';
import { RefreshTokenService } from './refresh-token.service';
import * as bcrypt from 'bcryptjs';
import { KafkaService } from '../../kafka/kafka.service';
import { User } from '.prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly kafkaService: KafkaService,
  ) {}

  async register(data: CreateUserDto): Promise<User> {
    const { email, password, phone } = data;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, phone },
    });

    await this.roleService.assignRoleToUser(user.id, 'CUSTOMER');
    await this.accountsService.createAccount(user.id, 'LOCAL', email);

    // Emit event to Kafka
    this.kafkaService.emit('user.registered', {
      userId: user.id,
      email: user.email,
      phone: user.phone,
    });

    return user;
  }

  async validate(username: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: username },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async localLogin(user: any) {
    const payload = { sub: user.id, username: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user.id,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async updateUser(
    id: string,
    updateData: Partial<CreateUserDto>,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Emit event to Kafka
    this.kafkaService.emit('user.updated', {
      userId: updatedUser.id,
      email: updatedUser.email,
      phone: updatedUser.phone,
    });

    return updatedUser;
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deletedUser = await this.prisma.user.delete({ where: { id } });

    // Emit event to Kafka
    this.kafkaService.emit('user.deleted', { userId: deletedUser.id });

    return deletedUser;
  }

  async refreshToken(oldRefreshToken: string) {
    const user =
      await this.refreshTokenService.validateRefreshToken(oldRefreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { sub: user.id, username: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user.id,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
