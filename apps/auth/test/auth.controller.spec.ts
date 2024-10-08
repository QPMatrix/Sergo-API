import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthController } from '../src/auth.controller';
import { AuthService } from '../src/auth.service';
import { CreateUserDto } from '../src/dto/create-user.dto';

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
        phone: null,
        firstName: 'test',
        lastName: 'test',
        birthday: new Date('1990-01-01'),
      };
      const mockUser = { id: '123', ...createUserDto };

      authService.register = jest.fn().mockResolvedValueOnce(mockUser);

      const result = await authController.register(createUserDto);

      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if the user already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'test',
        phone: null,
        firstName: 'test',
        lastName: 'test',
        birthday: new Date('1990-01-01'),
      };
      authService.register = jest
        .fn()
        .mockRejectedValueOnce(new ConflictException('User already exists'));

      await expect(authController.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
