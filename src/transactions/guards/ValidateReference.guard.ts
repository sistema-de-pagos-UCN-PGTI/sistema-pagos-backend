import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  Observable,
  catchError,
  firstValueFrom,
  from,
  map,
  mergeMap,
  of,
  switchMap,
} from 'rxjs';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { User } from 'src/user/models/user.interface';
import { ValidReferencesDto } from '../dto/valid-references.dto';
import { TransactionsService } from '../transactions.service';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ValidateTransactionReferencesGuard implements CanActivate {
    constructor(
        private transactionService: TransactionsService,
        private userService: UserService,
    ) {}

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const createTransaction: CreateTransactionDto = request.body;
        const authHeader = request.headers.authorization;
        
        if (!createTransaction) {
            return true; // Allow the request to proceed if there's no transaction data
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
                return false;
            }

            const dtoInstance = plainToClass(
                CreateTransactionDto,
                createTransaction,
            );
            const errors = await firstValueFrom(from(validate(dtoInstance)));
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
                    createTransaction.remittentEmail,
                    createTransaction.destinataryEmail,
                    createTransaction.projectName,
                    createTransaction.paymentMethodName,
                )
            );

            const { remittentUser } = validatedReferences;
            if (
                remittentUser &&
                remittentUser.userid !== tokenUser.userid &&
                !user.role.some((role) => role.name === 'admin')
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
        }
    }
}