import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/models/user.interface';
import { Observable, catchError, forkJoin, from, map, switchMap } from 'rxjs';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectsService } from 'src/projects/projects.service';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { PaymentMethod } from '../payment-method/entities/paymentMethod.entity';
import { AuthService } from 'src/auth/auth.service';
import { UserTransactions } from './dto/user-transactions.dto';
import { ValidTransactionsReferencesDto } from './dto/valid-transactions-references.dto';
import { ValidReferencesDto } from './dto/valid-references.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private userService: UserService,
    private projectService: ProjectsService,
    private paymentMethodService: PaymentMethodService,
    private authService: AuthService,
  ) {}
  create(
    createTransaction: ValidTransactionsReferencesDto,
  ): Observable<Transaction> {
    const newTransaction = {
      remittent: createTransaction.remittentUser,
      destinatary: createTransaction.destinataryUser,
      project: createTransaction.project,
      paymentMethod: createTransaction.paymenMethod,
      description: createTransaction.description,
      amount: createTransaction.amount,
      date: createTransaction.date,
      status: createTransaction.status,
    };

    return from(this.transactionRepository.save(newTransaction)).pipe(
      map((savedTransaction) => {
        // Eliminar propiedades hashedpassword
        if (savedTransaction.remittent) {
          delete savedTransaction.remittent.hashedpassword;
        }
        if (savedTransaction.destinatary) {
          delete savedTransaction.destinatary.hashedpassword;
        }
        return savedTransaction;
      }),
    );
  }

  findAllUserTransactions(token: string): Observable<{
    receivedTransactions: Transaction[];
    emittedTransactions: Transaction[];
  }> {
    return from(this.authService.decodeJWT(token)).pipe(
      switchMap((user: User) => {
        return this.userService.findByEmail(user.email); // Busca al usuario por email
      }),
      switchMap((foundUser: User) => {
        if (!foundUser) {
          throw new Error('User not found');
        }

        const receivedTransactions$ = this.transactionRepository.find({
          where: { destinatary: foundUser },
        });

        const emittedTransactions$ = this.transactionRepository.find({
          where: { remittent: foundUser },
        });

        return from(
          Promise.all([receivedTransactions$, emittedTransactions$]),
        ).pipe(
          // Renombrar las propiedades del objeto resultante
          switchMap(([receivedTransactions, emittedTransactions]) => {
            return [{ receivedTransactions, emittedTransactions }];
          }),
        );
      }),
    );
  }
  checkReferences(
    remittentEmail: string,
    destinataryEmail,
    projectName: string,
    paymentMethodName: string,
  ): Observable<ValidReferencesDto> {
    const remittentUser$: Observable<User> = from(
      this.userService.findByEmail(remittentEmail),
    );

    const destinataryUser$: Observable<User> = from(
      this.userService.findByEmail(destinataryEmail),
    );

    const project$: Observable<Project> = from(
      this.projectService.finOneByName(projectName),
    );

    const paymentMethod$: Observable<PaymentMethod> = from(
      this.paymentMethodService.findOneByName(paymentMethodName),
    );

    return forkJoin([
      remittentUser$,
      destinataryUser$,
      project$,
      paymentMethod$,
    ]).pipe(
      map(([remittentUser, destinataryUser, project, paymentMethod]) => {
        const observables = [
          [remittentUser, remittentEmail],
          [destinataryUser, destinataryEmail],
          [project, projectName],
          [paymentMethod, paymentMethodName],
        ];
        const errorMessages = observables.reduce(
          (messages, [observable, data]) => {
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
        if (remittentUser) {
          delete remittentUser.hashedpassword;
        }
        if (destinataryUser) {
          delete destinataryUser.hashedpassword;
        }

        const validatedReferences: ValidReferencesDto = {
          remittentUser,
          destinataryUser,
          project,
          paymentMethod,
        };
        return validatedReferences;
      }),
    );
  }
  findOne(transactionId: number): Observable<Transaction> {
    return from(
      this.transactionRepository.findOne({
        where: { transactionid: transactionId },
        relations: ['remittent', 'destinatary', 'project', 'paymentMethod'],
      }),
    ).pipe(
      map((transaction) => {
        if (transaction) {
          const { remittent, destinatary, ...rest } = transaction;

          if (remittent) {
            delete remittent.hashedpassword;
          }
          if (destinatary) {
            delete destinatary.hashedpassword;
          }
          return { ...rest, remittent, destinatary } as Transaction;
        }
        return null;
      }),
    );
  }
  finAll() {
    return this.transactionRepository.find();
  }
  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
