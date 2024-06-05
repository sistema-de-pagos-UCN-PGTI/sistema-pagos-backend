import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable, map, of, switchMap } from 'rxjs';
import { User } from 'src/user/models/user.interface';
import { SubscriptionService } from '../subscription.service';
import { Role } from 'src/roles/models/role.interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ValidateSubscriptionProprietaryGuard implements CanActivate {
  constructor(
    private subscriptionService: SubscriptionService,
    private userService: UserService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const tokenUser: User = req.user.user;
    const subscriptionplanid: number = +req.params.subscriptionplanid;

    return this.userService.findOne(tokenUser.userid).pipe(
      switchMap((user) => {
        if (!user) {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        if (user.role.some((role: Role) => role.name === 'admin')) {
          return of(true);
        }

        return this.subscriptionService.findOne(subscriptionplanid).pipe(
          switchMap((subscription) => {
            if (!subscription) {
              throw new HttpException(
                'Transaction not found',
                HttpStatus.NOT_FOUND,
              );
            }

            if (subscription.remittent.userid !== user.userid) {
              throw new HttpException(
                'Invalid Action, subscription doesn’t belong to the logged user',
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
