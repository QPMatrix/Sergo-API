import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from '../services/refresh-token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    public configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { exp } = payload;
    const currentTime = Math.floor(Date.now() / 1000);

    if (exp < currentTime) {
      try {
        return await this.refreshTokenService.refreshToken(payload.sub);
      } catch (error) {
        console.log(error);
        throw new UnauthorizedException(
          'Access token expired, and refresh token is invalid.',
        );
      }
    }

    return { userId: payload.sub, username: payload.username };
  }
}
