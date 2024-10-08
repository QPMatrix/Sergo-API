import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { RoleType } from '.prisma/client';
import { RoleService } from '../src/services/role.service';
import { PrismaService } from '../src/services/prisma.service';

describe('RoleService', () => {
  let service: RoleService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    role: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    roleAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockRole = { id: 'role-id', name: 'CUSTOMER' };
  const mockRoleAssignment = { userId: 'user-id', roleId: 'role-id' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      mockPrismaService.role.create.mockResolvedValue(mockRole);

      const result = await service.createRole(RoleType.CUSTOMER);

      expect(prismaService.role.create).toHaveBeenCalledWith({
        data: { name: RoleType.CUSTOMER },
      });
      expect(result).toEqual(mockRole);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.roleAssignment.create.mockResolvedValue(
        mockRoleAssignment,
      );

      const result = await service.assignRoleToUser(
        'user-id',
        RoleType.CUSTOMER,
      );

      expect(prismaService.role.findUnique).toHaveBeenCalledWith({
        where: { name: RoleType.CUSTOMER },
      });
      expect(prismaService.roleAssignment.create).toHaveBeenCalledWith({
        data: { userId: 'user-id', roleId: mockRole.id },
      });
      expect(result).toEqual(mockRoleAssignment);
    });

    it('should create role if not exists and assign to user', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);
      mockPrismaService.role.create.mockResolvedValue(mockRole);
      mockPrismaService.roleAssignment.create.mockResolvedValue(
        mockRoleAssignment,
      );

      const result = await service.assignRoleToUser(
        'user-id',
        RoleType.CUSTOMER,
      );

      expect(prismaService.role.create).toHaveBeenCalledWith({
        data: { name: RoleType.CUSTOMER },
      });
      expect(prismaService.roleAssignment.create).toHaveBeenCalledWith({
        data: { userId: 'user-id', roleId: mockRole.id },
      });
      expect(result).toEqual(mockRoleAssignment);
    });
  });

  describe('getRolesForUser', () => {
    it('should get roles for user successfully', async () => {
      const roles = [{ ...mockRoleAssignment, role: mockRole }];
      mockPrismaService.roleAssignment.findMany.mockResolvedValue(roles);

      const result = await service.getRolesForUser('user-id');

      expect(prismaService.roleAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        include: { role: true },
      });
      expect(result).toEqual(roles);
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user successfully', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.roleAssignment.deleteMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.removeRoleFromUser(
        'user-id',
        RoleType.CUSTOMER,
      );

      expect(prismaService.role.findUnique).toHaveBeenCalledWith({
        where: { name: RoleType.CUSTOMER },
      });
      expect(prismaService.roleAssignment.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', roleId: mockRole.id },
      });
      expect(result).toEqual({ count: 1 });
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.removeRoleFromUser('user-id', RoleType.CUSTOMER),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
