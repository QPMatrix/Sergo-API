import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RoleType } from '.prisma/client';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new role if it does not exist
  async createRole(name: RoleType) {
    return this.prisma.role.create({
      data: { name },
    });
  }

  // Assign a role to a user
  async assignRoleToUser(userId: string, roleName: RoleType) {
    console.log('Assigning role to user', userId, roleName);

    // Check if the role exists
    let role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    // If the role does not exist, create it and assign it to the variable
    if (!role) {
      role = await this.createRole(roleName);
    }

    // Create a role assignment for the user
    return this.prisma.roleAssignment.create({
      data: {
        userId,
        roleId: role.id,
      },
    });
  }
}
