import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/models/user.interface';
import {
  Observable,
  catchError,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  throwError,
  toArray,
} from 'rxjs';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectsService } from 'src/projects/projects.service';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { PaymentMethod } from '../payment-method/entities/paymentMethod.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { Users } from 'src/user/models/user.entity';
import { UserTransactions } from './dto/user-transactions.dto';
import { ValidTransactionsReferencesDto } from './dto/valid-references.dto';

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
      project: createTransaction.projec,
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

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
