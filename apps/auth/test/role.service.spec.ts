import { Test, TestingModule } from '@nestjs/testing';
import { RoleType } from '.prisma/client';
import { RoleService } from '../src/services/role.service';
import { PrismaService } from '../src/services/prisma.service';

describe('RoleService', () => {
  let roleService: RoleService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: {
            role: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            roleAssignment: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    roleService = module.get<RoleService>(RoleService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(roleService).toBeDefined();
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockRole = { id: '1', name: RoleType.CUSTOMER };
      prismaService.role.create = jest.fn().mockResolvedValueOnce(mockRole);

      const result = await roleService.createRole(RoleType.CUSTOMER);
      expect(prismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: RoleType.CUSTOMER,
        },
      });
      expect(result).toEqual(mockRole);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign an existing role to a user', async () => {
      const mockRole = { id: '1', name: RoleType.CUSTOMER };
      const mockRoleAssignment = { id: '1', userId: '123', roleId: '1' };

      // Mock findUnique to return the role
      prismaService.role.findUnique = jest.fn().mockResolvedValueOnce(mockRole);

      // Mock roleAssignment.create to assign the role
      prismaService.roleAssignment.create = jest
        .fn()
        .mockResolvedValueOnce(mockRoleAssignment);

      const result = await roleService.assignRoleToUser(
        '123',
        RoleType.CUSTOMER,
      );

      expect(prismaService.role.findUnique).toHaveBeenCalledWith({
        where: { name: RoleType.CUSTOMER },
      });

      expect(prismaService.roleAssignment.create).toHaveBeenCalledWith({
        data: {
          userId: '123',
          roleId: mockRole.id,
        },
      });

      expect(result).toEqual(mockRoleAssignment);
    });

    it('should create the role if it does not exist and assign it', async () => {
      const mockRole = { id: '1', name: RoleType.CUSTOMER };
      const mockRoleAssignment = { id: '1', userId: '123', roleId: '1' };

      // Mock findUnique to return null, so the role will be created
      prismaService.role.findUnique = jest.fn().mockResolvedValueOnce(null);

      // Mock role.create to create the role
      prismaService.role.create = jest.fn().mockResolvedValueOnce(mockRole);

      // Mock roleAssignment.create to assign the newly created role
      prismaService.roleAssignment.create = jest
        .fn()
        .mockResolvedValueOnce(mockRoleAssignment);

      const result = await roleService.assignRoleToUser(
        '123',
        RoleType.CUSTOMER,
      );

      expect(prismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: RoleType.CUSTOMER,
        },
      });

      expect(prismaService.roleAssignment.create).toHaveBeenCalledWith({
        data: {
          userId: '123',
          roleId: mockRole.id,
        },
      });

      expect(result).toEqual(mockRoleAssignment);
    });
  });
});
