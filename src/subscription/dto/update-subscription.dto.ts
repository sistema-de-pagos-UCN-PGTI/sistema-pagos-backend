import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { IsValidPeriodicity } from '../decorators/periodicitydto.decorator';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
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
