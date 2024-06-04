import { PaymentMethod } from 'src/payment-method/entities/paymentMethod.entity';
import { Project } from 'src/projects/entities/project.entity';
import { User } from 'src/user/models/user.interface';

export class ValidReferencesDto {
  remittentUser: User;
  destinataryUser: User;
  project: Project;
  paymentMethod: PaymentMethod;
}
