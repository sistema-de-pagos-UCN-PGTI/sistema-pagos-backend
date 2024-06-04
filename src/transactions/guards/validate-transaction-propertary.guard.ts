import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TransactionsService } from '../transactions.service';
import { User } from 'src/user/models/user.interface';

@Injectable()
export class ValidateTransactionProprietaryGuard implements CanActivate {
  constructor(private transactionService: TransactionsService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
