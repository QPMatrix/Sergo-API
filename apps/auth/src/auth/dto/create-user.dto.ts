import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'hasan',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'diab',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;
  @ApiProperty({
    description: 'The email of the user',
    example: 'hasan@qpmatrix.tech',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({
    description: 'The password of the user',
    example: 'StrongPassword!1234',
  })
  @IsString()
  @IsOptional({ always: true })
  @Min(8)
  password?: string;
  @ApiProperty({
    description: 'The phone of the user',
    example: '+972524802045',
  })
  @IsString()
  @IsOptional({ always: true })
  @Min(12)
  @Max(15)
  phone?: string;
  @ApiProperty({
    description: 'The birthday of the user',
    example: '16/01/2002',
  })
  @IsDate()
  birthday: Date;
}
