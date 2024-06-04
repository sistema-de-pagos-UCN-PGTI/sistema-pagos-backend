import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { User } from 'src/user/models/user.interface';
import { SubscriptionService } from '../subscription.service';

@Injectable()
export class ValidateSubscriptionProprietaryGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const tokenUser: User = request.user.user;
    const subscriptionPlanId: number = +request.params.subscriptionplanid;
    return this.subscriptionService.findOne(subscriptionPlanId).pipe(
      map((subscriptionPlan) => {
        if (subscriptionPlan.remittent.userid !== tokenUser.userid) {
          throw new HttpException(
            'Invalid action, the subscriptionPlan doesn´t belong to the logged-in user.',
            HttpStatus.FORBIDDEN,
          );
        }
        return true;
      }),
    );
  }
}
