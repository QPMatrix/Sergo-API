import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RoleType } from '.prisma/client';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(name: RoleType) {
    return this.prisma.role.create({ data: { name } });
  }

  async assignRoleToUser(userId: string, roleName: RoleType) {
    let role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) role = await this.createRole(roleName);

    return this.prisma.roleAssignment.create({
      data: { userId, roleId: role.id },
    });
  }

  async getRolesForUser(userId: string) {
    return this.prisma.roleAssignment.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  async removeRoleFromUser(userId: string, roleName: RoleType) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    return this.prisma.roleAssignment.deleteMany({
      where: { userId, roleId: role.id },
    });
  }
}
