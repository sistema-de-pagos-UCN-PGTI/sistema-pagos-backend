import {
  IsDate,
  IsEmail,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidPeriodicity } from '../decorators/periodicitydto.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
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

  @ApiProperty({ example: 'Subscripción A AmazonWebVideo by admin' })
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
  @MinLength(4)
  @IsString()
  status: string;

  @ApiProperty({ example: 'daily' })
  @IsValidPeriodicity()
  periodicity: string;
}
