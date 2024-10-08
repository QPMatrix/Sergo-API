import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'hasan',
  })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'diab',
  })
  lastName: string;
  @ApiProperty({
    description: 'The email of the user',
    example: 'hasan@qpmatrix.tech',
  })
  email: string;
  @ApiProperty({
    description: 'The password of the user',
    example: 'StrongPassword!1234',
  })
  password?: string;
  @ApiProperty({
    description: 'The phone of the user',
    example: '+972524802045',
  })
  phone?: string;
  @ApiProperty({
    description: 'The birthday of the user',
    example: '16/01/2002',
  })
  birthday: Date;
}
