import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { TransactionsService } from '../transactions.service';
import { User } from 'src/user/models/user.interface';
import { UserService } from '../../user/user.service';
import { Role } from 'src/roles/models/role.interface';

@Injectable()
export class ValidateTransactionProprietaryGuard implements CanActivate {
  constructor(
    private transactionService: TransactionsService,
    private userService: UserService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const tokenUser: User = req.user.user;
    const transactionId: number = +req.params.transactionId;

    return this.userService.findOne(tokenUser.userid).pipe(
      switchMap((user) => {
        if (!user) {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        return this.transactionService.findOne(transactionId).pipe(
          switchMap((transaction) => {
            console.log('transacción', transaction);
            if (!transaction) {
              throw new HttpException(
                'Transaction not found',
                HttpStatus.NOT_FOUND,
              );
            }
            if (user.role.some((role: Role) => role.name === 'admin')) {
              return of(true);
            }
            if (transaction.remittent.userid !== user.userid) {
              throw new HttpException(
                'Invalid Action, transaction doesn’t belong to the logged user',
                HttpStatus.BAD_REQUEST,
              );
            }

            return of(true);
          }),
        );
      }),
    );
  }
}
