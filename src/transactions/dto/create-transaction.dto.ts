import {
  IsDate,
  IsEmail,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'claudio.user@user.com' })
  @IsEmail()
  remittentEmail: string;

  @ApiProperty({ example: 'diego.gonzalez07@alumnos.ucn.cl' })
  @IsEmail()
  destinataryEmail: string;

  @ApiProperty({ example: 'Proyecto De Sistema De pagos' })
  @IsString()
  @MinLength(2)
  projectName: string;

  @ApiProperty({ example: 'Subscripción Netflix' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Transbank' })
  @IsString()
  @MinLength(2)
  paymentMethodName: string;

  @ApiProperty({ example: 1000000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2023-06-01' })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @ApiProperty({ example: 'vigente' })
  @IsString()
  @MinLength(1)
  status: string;
}
