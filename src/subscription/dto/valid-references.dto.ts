import { Transform } from 'class-transformer';
import { IsEmail, IsNumber, IsString, MinLength } from 'class-validator';
import { PaymentMethod } from 'src/payment-method/entities/paymentMethod.entity';
import { Project } from 'src/projects/entities/project.entity';
import { User } from 'src/user/models/user.interface';
import { IsValidPeriodicity } from '../../subscription/decorators/periodicitydto.decorator';

export class ValidSubscriptionReferencesDto {
  @IsString()
  @MinLength(2)
  description: string;
  @IsNumber()
  amount: number;
  @Transform(({ value }) => new Date(value))
  startDate: Date;
  @IsString()
  @MinLength(2)
  status: string;
  remittentUser: User;
  destinataryUser: User;
  project: Project;
  paymentmethod: PaymentMethod;
  @IsValidPeriodicity()
  periodicity: string;
}
