import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/models/user.interface';
import { Observable, forkJoin, from, map, switchMap } from 'rxjs';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectsService } from 'src/projects/projects.service';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { PaymentMethod } from '../payment-method/entities/paymentMethod.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private userService: UserService,
    private projectService: ProjectsService,
    private paymentMethodService: PaymentMethodService,
  ) {}
  create(createTransactionDto: CreateTransactionDto): Observable<Transaction> {
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
        createTransactionDto.paymentMethod,
      ),
    );

    return forkJoin([
      remittentUser$,
      destinataryUser$,
      project$,
      paymentMethod$,
    ]).pipe(
      switchMap(([remittentUser, destinataryUser, project, paymentMethod]) => {
        if (!remittentUser || !destinataryUser || !project || !paymentMethod) {
          throw new Error('Invalid data');
        }

        const newTransaction = this.transactionRepository.create({
          remittent: remittentUser,
          destinatary: destinataryUser,
          project,
          paymentMethod,
          description: createTransactionDto.description,
          amount: createTransactionDto.amount,
          date: createTransactionDto.date,
          status: createTransactionDto.status,
        });

        return from(this.transactionRepository.save(newTransaction)).pipe(
          map((savedTransaction) => {
            delete savedTransaction.remittent.hashedpassword;
            delete savedTransaction.destinatary.hashedpassword;
            return savedTransaction;
          }),
        );
      }),
    );
  }

  findAll() {
    return `This action returns all transactions`;
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
