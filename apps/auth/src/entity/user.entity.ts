import { ApiProperty } from '@nestjs/swagger';
import { User } from '.prisma/client';

export class UserEntity implements User {
  @ApiProperty({
    description: 'The unique identifier for the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '+123456789',
    required: false, // Optional property
  })
  phone: string;

  @ApiProperty({
    description: 'The hashed password of the user',
    example: 'hashedPassword',
  })
  password: string;

  @ApiProperty({
    description: 'The date the user was created',
    example: '2023-10-08T12:34:56Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date the user was last updated',
    example: '2023-10-08T12:34:56Z',
  })
  updatedAt: Date;
}
