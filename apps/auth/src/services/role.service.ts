import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RoleType } from '.prisma/client';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}
  async createRole(name: RoleType) {
    return this.prisma.role.create({
      data: {
        name,
      },
    });
  }
  async assignRoleToUser(userId: string, roleName: RoleType) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      await this.createRole(roleName);
    }
    await this.prisma.roleAssignment.create({
      data: {
        userId,
        roleId: role.id,
      },
    });
  }
}
