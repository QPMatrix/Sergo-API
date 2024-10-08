import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Request } from 'express';

@Controller('auth')
@ApiTags('auth') // Grouping API endpoints under "auth" tag
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: UserEntity,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: User already exists',
    type: ConflictException,
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration data',
  })
  async register(@Body() data: CreateUserDto) {
    return this.authService.register(data);
  }

  @UseGuards(LocalAuthGuard)
  @Post('local/login')
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: UserEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Invalid credentials',
    type: UnauthorizedException,
  })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  async localLogin(@Req() req: Request) {
    return req.user;
  }
}
