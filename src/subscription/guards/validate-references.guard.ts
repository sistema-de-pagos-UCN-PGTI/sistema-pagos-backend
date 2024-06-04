import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { Observable, catchError, from, map, mergeMap } from 'rxjs';
import { ValidReferencesDto } from 'src/transactions/dto/valid-references.dto';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { plainToClass } from 'class-transformer';
import { User } from 'src/user/models/user.interface';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class ValidateReferencesGuard implements CanActivate {
  constructor(private transactionService: TransactionsService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const createSubscription: CreateSubscriptionDto = request.body;
    if (!createSubscription) {
      return true;
    }
    const tokenUser: User = request.user.user;

    const dtoInstance = plainToClass(CreateSubscriptionDto, createSubscription);
    const validation$ = from(validate(dtoInstance)).pipe(
      mergeMap((errors) => {
        if (errors.length > 0) {
          // Format the validation errors
          const errorMessages = errors.map((err) => ({
            property: err.property,
            constraints: err.constraints,
          }));
          throw new BadRequestException({
            message: 'Validation failed',
            errors: errorMessages,
          });
        }
        return this.transactionService.checkReferences(
          createSubscription.remittentEmail,
          createSubscription.destinataryEmail,
          createSubscription.projectName,
          createSubscription.paymentMethodName,
        );
      }),
      map((validatedReferences: ValidReferencesDto) => {
        const { remittentUser } = validatedReferences;

        if (remittentUser && remittentUser.userid !== tokenUser.userid) {
          throw new HttpException(
            {
              message: `Invalid action, the remittent is not the logged-in user. Invalid Remittent: ${remittentUser.email}`,
            },
            HttpStatus.FORBIDDEN,
          );
        }
        request.validatedReferences = validatedReferences;
        return true;
      }),
      catchError((error) => {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new HttpException(
          {
            message: 'References Validation Error.',
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }),
    );

    return validation$;
  }
}
