import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async generateRefreshToken(userId: string): Promise<string> {
    const existingToken = await this.prisma.refreshToken.findFirst({
      where: { userId },
    });

    if (existingToken) {
      return existingToken.token;
    }

    const token = this.jwtService.sign({ sub: userId }, { expiresIn: '7d' });
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return token;
  }

  async validateRefreshToken(token: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken)
      throw new UnauthorizedException('Refresh token not found');
    if (new Date() > storedToken.expiresAt)
      throw new UnauthorizedException('Refresh token expired');

    return storedToken.user;
  }

  async refreshToken(userId: string) {
    const newAccessToken = this.jwtService.sign({ sub: userId });
    const newRefreshToken = await this.generateRefreshToken(userId);
    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }
}
