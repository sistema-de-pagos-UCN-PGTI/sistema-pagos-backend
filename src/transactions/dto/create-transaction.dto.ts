import {
  IsDate,
  IsEmail,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
export class CreateTransactionDto {
  @IsEmail()
  remittentEmail: string;
  @IsEmail()
  destinataryEmail: string;
  @IsString()
  @MinLength(2)
  projectName: string;
  @IsString()
  description: string;
  @IsString()
  @MinLength(2)
  paymentMethodName: string;
  @IsNumber()
  amount: number;
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;
  @IsString()
  @MinLength(1)
  status: string;
}
