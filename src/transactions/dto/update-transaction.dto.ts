import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiProperty({ example: 'Subscripción Netflix', required: false })
  @IsString()
  description: string;

  @ApiProperty({ example: 1000000, required: false })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2023-06-01', required: false })
  date: Date;

  @ApiProperty({ example: 'vigente', required: false })
  status: string;
}
