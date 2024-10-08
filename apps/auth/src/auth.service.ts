import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from './services/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: CreateUserDto) {
    const { email, password, phone } = data;
    try {
      const isUserExists = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { phone }],
        },
      });
      if (isUserExists) {
        return new ConflictException('User already exists'); // Throw an exception properly
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,
        },
      });

      // TODO: Send email verification + communicate with customer servers and profile servers
      return user;
    } catch (e) {
      throw e;
    }
  }
}
