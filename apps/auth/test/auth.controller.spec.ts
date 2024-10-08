import { Test, TestingModule } from '@nestjs/testing';

import { IUserInterface } from '@app/common';
import { User } from '.prisma/client';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';
import { AuthController } from '../src/auth.controller';
import { AuthService } from '../src/auth.service';
import { JwtAuthGuard } from '../src/guard/jwt-auth.guard';
import { LocalAuthGuard } from '../src/guard/local-auth.guard';
import { CreateUserDto } from '../src/dto/create-user.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    localLogin: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    phone: '1234567890',
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  const mockIUserInterface: IUserInterface = {
    userId: 'user-id',
    email: 'test@example.com',
    roles: ['CUSTOMER'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'StrongPassword!1234',
        phone: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
        birthday: new Date('1990-01-01'),
      };
      mockAuthService.register.mockResolvedValue(mockUser);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'StrongPassword!1234',
        phone: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
        birthday: new Date('1990-01-01'),
      };
      mockAuthService.register.mockRejectedValue(
        new ConflictException('User already exists'),
      );

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('localLogin', () => {
    it('should log in a user successfully', async () => {
      const tokens = {
        access_token: 'jwt-token-here',
        refresh_token: 'refresh-token-here',
      };
      mockAuthService.localLogin.mockResolvedValue(tokens);

      const result = await controller.localLogin(mockIUserInterface);

      expect(authService.localLogin).toHaveBeenCalledWith(mockIUserInterface);
      expect(result).toEqual(tokens);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      mockAuthService.localLogin.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.localLogin(mockIUserInterface)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', () => {
      const result = controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update the user successfully', async () => {
      const updateData = { email: 'new@example.com' };
      const updatedUser = { ...mockUser, email: 'new@example.com' };
      mockAuthService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(
        updateData,
        mockIUserInterface,
      );

      expect(authService.updateUser).toHaveBeenCalledWith(
        mockIUserInterface.userId,
        updateData,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const updateData = { email: 'new@example.com' };
      mockAuthService.updateUser.mockRejectedValue(new Error('User not found'));

      await expect(
        controller.updateUser(updateData, mockIUserInterface),
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete the user successfully', async () => {
      mockAuthService.deleteUser.mockResolvedValue(mockUser);

      const result = await controller.deleteUser(mockIUserInterface);

      expect(authService.deleteUser).toHaveBeenCalledWith(
        mockIUserInterface.userId,
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockAuthService.deleteUser.mockRejectedValue(new Error('User not found'));

      await expect(controller.deleteUser(mockIUserInterface)).rejects.toThrow(
        'User not found',
      );
    });
  });
});
