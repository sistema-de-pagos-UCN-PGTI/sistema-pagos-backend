import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable, forkJoin, from, map } from 'rxjs';
import { PaymentMethod } from 'src/payment-method/entities/paymentMethod.entity';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectsService } from 'src/projects/projects.service';
import { User } from 'src/user/models/user.interface';
import { UserService } from 'src/user/user.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Injectable()
export class ValidateReferencesGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private projectService: ProjectsService,
    private paymentMethodService: PaymentMethodService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const createTransactionDto: CreateTransactionDto = request.body;
    const tokenUser: User = request.user.user;
    const remittentUser$: Observable<User> = from(
      this.userService.findByEmail(createTransactionDto.remittentEmail),
    );
    const destinataryUser$: Observable<User> = from(
      this.userService.findByEmail(createTransactionDto.destinataryEmail),
    );
    const project$: Observable<Project> = from(
      this.projectService.finOneByName(createTransactionDto.projectName),
    );
    const paymentMethod$: Observable<PaymentMethod> = from(
      this.paymentMethodService.findOneByName(
        createTransactionDto.paymentMethodName,
      ),
    );

    return forkJoin([
      remittentUser$,
      destinataryUser$,
      project$,
      paymentMethod$,
    ]).pipe(
      map(([remittentUser, destinataryUser, project, paymentMethod]) => {
        const observables = [
          [remittentUser, createTransactionDto.remittentEmail],
          [destinataryUser, createTransactionDto.destinataryEmail],
          [project, createTransactionDto.projectName],
          [paymentMethod, createTransactionDto.paymentMethodName],
        ];
        const errorMessages = observables.reduce(
          (messages, [observable, data]) => {
            if (remittentUser && remittentUser.userid !== tokenUser.userid) {
              throw new HttpException(
                {
                  message: `Invalid Transaction, the remittent is not the logged User. Invalid Remittent: ${remittentUser.email}`,
                },
                HttpStatus.FORBIDDEN,
              );
            }
            if (!observable) {
              messages.push(`${data} not found`);
            }

            return messages;
          },
          [],
        );
        if (errorMessages.length > 0) {
          throw new HttpException(
            { message: errorMessages },
            HttpStatus.BAD_REQUEST,
          );
        }

        const { description, amount, date, status } = createTransactionDto;
        request.validatedReferences = {
          description,
          amount,
          date,
          status,
          remittentUser,
          destinataryUser,
          project,
          paymentMethod,
        };

        return true;
      }),
    );
  }
}
