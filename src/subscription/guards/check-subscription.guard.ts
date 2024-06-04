import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable, from, map } from 'rxjs';
import { SubscriptionService } from '../subscription.service';
import { SubscriptionPlan } from '../entities/subcriptionPlans.entity';
import { error } from 'console';
import { User } from 'src/user/models/user.interface';

export class CheckSubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const subscriptionPlanId: number = +req.params.subscriptionplanid;

    return this.subscriptionService.findOne(subscriptionPlanId).pipe(
      map((subscription) => {
        if (subscription) {
          const tokenUser: User = req.user;
          if (tokenUser.userid !== subscription.remittent.userid) {
            throw new HttpException(
              {
                message: 'Subscription Doesn´t belong to the user',
              },
              HttpStatus.FORBIDDEN,
            );
          }
          return true;
        } else {
          throw new HttpException(
            {
              message: 'Subscription Doesn´t Exist',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }),
    );
  }
}
