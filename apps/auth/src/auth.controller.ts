import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entity/user.entity';
import { CurrentUser, IUserInterface } from '@app/common';
import { User } from '.prisma/client';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: UserEntity,
  })
  async register(@Body() data: CreateUserDto) {
    return this.authService.register(data);
  }

  @UseGuards(LocalAuthGuard)
  @Post('local/login')
  @ApiResponse({
    status: 201,
    description: 'User successfully logged in',
    schema: {
      properties: {
        access_token: { type: 'string', example: 'jwt-token-here' },
        refresh_token: { type: 'string', example: 'refresh-token-here' },
      },
    },
  })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string', example: 'hasan@qpmatrix.tech' },
        password: { type: 'string', example: 'StrongPassword!1234' },
      },
    },
  })
  async localLogin(@CurrentUser() user: IUserInterface) {
    return this.authService.localLogin(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('access_token')
  @ApiResponse({ status: 200, description: 'Get user profile' })
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('update-user/:id')
  @ApiBearerAuth('access_token')
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiBody({
    type: CreateUserDto,
    description: 'Data to update the user',
  })
  async updateUser(
    @Body() updateData: Partial<CreateUserDto>,
    @CurrentUser() user: IUserInterface,
  ) {
    return this.authService.updateUser(user.userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-user/:id')
  @ApiBearerAuth('access_token')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@CurrentUser() user: IUserInterface) {
    return this.authService.deleteUser(user.userId);
  }
}
