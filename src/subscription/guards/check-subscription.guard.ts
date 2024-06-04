import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable, from, map } from 'rxjs';
import { SubscriptionService } from '../subscription.service';
@Injectable()
export class CheckSubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const subscriptionPlanId: number = +req.params.subscriptionplanid;
    return this.subscriptionService.findOne(subscriptionPlanId).pipe(
      map((subscriptionPlan) => {
        if (subscriptionPlan) {
          return true;
        }
        throw new HttpException(
          'Subscription plan not found',
          HttpStatus.NOT_FOUND,
        );
      }),
    );
  }
}
