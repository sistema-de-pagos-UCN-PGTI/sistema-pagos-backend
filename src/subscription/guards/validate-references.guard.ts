import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { Observable, catchError, from, map, mergeMap, switchMap } from 'rxjs';
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
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const createSubscription: CreateSubscriptionDto = request.body;

    if (!createSubscription) {
      return true;
    }

    const tokenUser: User = request.user.user;

    return this.userService.findOne(tokenUser.userid).pipe(
      switchMap((user) => {
        if (!user) {
          throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
        }

        const dtoInstance = plainToClass(
          CreateSubscriptionDto,
          createSubscription,
        );

        return from(validate(dtoInstance)).pipe(
          switchMap((errors) => {
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

            return this.transactionService.checkReferences(
              createSubscription.remittentEmail,
              createSubscription.destinataryEmail,
              createSubscription.projectName,
              createSubscription.paymentMethodName,
            );
          }),
          map((validatedReferences: ValidReferencesDto) => {
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
      }),
      catchError((error) => {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException(
          {
            message: 'User validation error.',
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }),
    );
  }
}
