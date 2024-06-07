import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable, firstValueFrom, map, of, switchMap } from 'rxjs';
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
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;
    //const tokenUser: User = req.user.user;
    const subscriptionplanid: number = +req.params.subscriptionplanid;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    let tokenUser: User;
    try {
      tokenUser = await firstValueFrom(
        this.userService.decodeToken(token).pipe(
          switchMap((decoded: any) => this.userService.findByEmail(decoded.email)),
          map((user: User) => user),
        ),
      );
    } catch (error) {
      throw new HttpException('Token decoding or user fetch failed', HttpStatus.UNAUTHORIZED);
    }

    const user = await firstValueFrom(this.userService.findOne(tokenUser.userid));
    
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (user.role.some((role: Role) => role.name === 'admin')) {
      return true;
    }

    const subscription = await firstValueFrom(this.subscriptionService.findOne(subscriptionplanid));
    
    if (!subscription) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }

    if (subscription.remittent.userid !== user.userid) {
      throw new HttpException(
        'Invalid Action, subscription doesn’t belong to the logged user',
        HttpStatus.BAD_REQUEST,
      );
    }

    return true;
  }
}