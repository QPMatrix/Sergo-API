import { Test, TestingModule } from '@nestjs/testing';

import { IUserInterface } from '@app/common';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthController } from '../src/auth/controllers/auth.controller';
import { AuthService } from '../src/auth/services/auth.service';
import { CreateUserDto } from '../src/auth/dto/create-user.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            localLogin: jest.fn(),
            getUserById: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should call AuthService.register and return the result', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'test',
        phone: '1234567890',
        firstName: 'Test',
        lastName: 'User',
        birthday: new Date('2000-01-01'),
      };
      const mockUser = { id: '123', ...createUserDto };

      (authService.register as jest.Mock).mockResolvedValue(mockUser);

      const result = await authController.register(createUserDto);
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new ConflictException('User already exists'),
      );

      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'test',
        phone: '1234567890',
        firstName: 'Test',
        lastName: 'User',
        birthday: new Date('2000-01-01'),
      };

      await expect(authController.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('localLogin', () => {
    it('should call AuthService.localLogin and return tokens', async () => {
      const mockUser: IUserInterface = {
        userId: '123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      };
      const mockTokens = {
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
      };

      (authService.localLogin as jest.Mock).mockResolvedValue(mockTokens);

      const result = await authController.localLogin(mockUser);
      expect(authService.localLogin).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException if login fails', async () => {
      (authService.localLogin as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      const mockUser: IUserInterface = {
        userId: '123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      };

      await expect(authController.localLogin(mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile by ID', async () => {
      const mockUser: IUserInterface = {
        userId: '123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      };

      (authService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authController.getProfile(mockUser);
      expect(authService.getUserById).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const mockUser: IUserInterface = {
        userId: '123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      };

      (authService.getUserById as jest.Mock).mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(authController.getProfile(mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user and return updated user', async () => {
      const mockUser: IUserInterface = {
        userId: '123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      };
      const updateData: Partial<CreateUserDto> = {
        email: 'updated@example.com',
      };
      const updatedUser = { ...mockUser, email: 'updated@example.com' };

      (authService.updateUser as jest.Mock).mockResolvedValue(updatedUser);

      const result = await authController.updateUser(updateData, mockUser);
      expect(authService.updateUser).toHaveBeenCalledWith(
        mockUser.userId,
        updateData,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const mockUser: IUserInterface = {
        userId: '123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      };
      const updateData: Partial<CreateUserDto> = {
        email: 'updated@example.com',
      };

      (authService.updateUser as jest.Mock).mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        authController.updateUser(updateData, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete the user and return the result', async () => {
      const mockUser: IUserInterface = {
        userId: '123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      };
      const deletedUser = { id: '123', email: 'test@example.com' };

      (authService.deleteUser as jest.Mock).mockResolvedValue(deletedUser);

      const result = await authController.deleteUser(mockUser);
      expect(authService.deleteUser).toHaveBeenCalledWith(mockUser.userId);
      expect(result).toEqual(deletedUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const mockUser: IUserInterface = {
        userId: '123',
        email: 'test@example.com',
        roles: ['CUSTOMER'],
      };

      (authService.deleteUser as jest.Mock).mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(authController.deleteUser(mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new access and refresh tokens', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      (authService.refreshToken as jest.Mock).mockResolvedValue(mockTokens);

      const result = await authController.refreshToken('old-refresh-token');
      expect(authService.refreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
      );
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(
        authController.refreshToken('invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
