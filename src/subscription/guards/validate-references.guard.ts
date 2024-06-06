import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { Observable, catchError, firstValueFrom, from, map, mergeMap, switchMap } from 'rxjs';
import { ValidReferencesDto } from 'src/transactions/dto/valid-references.dto';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { plainToClass } from 'class-transformer';
import { User } from 'src/user/models/user.interface';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Role } from 'src/roles/models/role.interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ValidateReferencesGuard implements CanActivate {
  constructor(
    private transactionService: TransactionsService,
    private userService: UserService,
  ) {}
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean>  {
    const request = context.switchToHttp().getRequest();
    const createSubscription: CreateSubscriptionDto = request.body;
    const authHeader = request.headers.authorization;
    
    if (!createSubscription) {
      return true;
    }

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


    try {
      const user = await firstValueFrom(this.userService.findOne(tokenUser.userid));

      if (!user) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }

      const dtoInstance = plainToClass(CreateSubscriptionDto, createSubscription);
      const errors = await validate(dtoInstance);

      if (errors.length > 0) {
        const errorMessages = errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
        }));
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
        });
      }

      const validatedReferences = await firstValueFrom(
        this.transactionService.checkReferences(
          createSubscription.remittentEmail,
          createSubscription.destinataryEmail,
          createSubscription.projectName,
          createSubscription.paymentMethodName,
        ),
      );

      const { remittentUser } = validatedReferences;

      if (
        !user.role.some((role: Role) => role.name === 'admin') &&
        remittentUser &&
        remittentUser.userid !== tokenUser.userid
      ) {
        throw new HttpException(
          {
            message: `Invalid action, the remittent is not the logged-in user. Invalid Remittent: ${remittentUser.email}`,
          },
          HttpStatus.FORBIDDEN,
        );
      }

      request.validatedReferences = validatedReferences;
      return true;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: 'References Validation Error.',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}