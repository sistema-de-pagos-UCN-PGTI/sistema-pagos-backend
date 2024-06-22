
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Repository } from 'typeorm';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ValidTransactionsReferencesDto } from './dto/valid-transactions-references.dto';
import { User } from 'src/user/models/user.interface';
import { Project } from 'src/projects/entities/project.entity';
import { PaymentMethod } from '../payment-method/entities/paymentMethod.entity';
import { UserModule } from 'src/user/user.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { PaymentMethodModule } from 'src/payment-method/payment-method.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserService } from 'src/user/user.service';
import { ProjectsService } from 'src/projects/projects.service';
import { AuthService } from 'src/auth/auth.service';

describe('TransactionsService', () => {
  let transactionService: TransactionsService;
  let repository: Repository<Transaction>;
  let userService: UserService;
  let projectService: ProjectsService;
  let authService: AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
        ProjectsModule,
        PaymentMethodModule,
        AuthModule,
        TypeOrmModule.forFeature([Transaction]),
      ],
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useClass: Repository,
        },
      ],
    }).compile();

    transactionService = module.get<TransactionsService>(TransactionsService);
    repository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      const createTransactionDto: ValidTransactionsReferencesDto = {
        remittentUser: {
          userid: 1,
          email: 'remittent@example.com',
          firstname: 'John',
          lastname: 'Doe',
          hashedpassword: 'hashedpassword',
          role: [], // Otras propiedades necesarias
        },
        destinataryUser: {
          userid: 2,
          email: 'destinatary@example.com',
          firstname: 'Jane',
          lastname: 'Doe',
          hashedpassword: 'hashedpassword',
          role: [],
        },
        project: {
          projectid: 1,
          name: 'Project 1',
          transactions: [],
          subscriptionPlans: [],
        } as Project,
        paymenMethod: {
          paymentmethodid: 1,
          name: 'Credit Card',
          transactions: [],
          subscriptionPlans: [],
        } as PaymentMethod,
        description: 'Payment for services',
        amount: 1000,
        date: new Date('2023-06-01'),
        status: 'pending',
      };

      const savedTransaction: Partial<Transaction> = {
        transactionid: 1,
        description: 'Payment for services',
        amount: 1000,
        date: new Date('2023-06-01'),
        status: 'pending',
        remittent: {
          userid: 1,
          email: 'remittent@example.com',
          firstname: 'John',
          lastname: 'Doe',
        } as User,
        destinatary: {
          userid: 2,
          email: 'destinatary@example.com',
          firstname: 'Jane',
          lastname: 'Doe',
        } as User,
        project: {
          projectid: 1,
          name: 'Project 1',
          transactions: [],
          subscriptionPlans: [],
        } as Project,
        paymentMethod: {
          paymentmethodid: 1,
          name: 'Credit Card',
          transactions: [],
          subscriptionPlans: [],
        } as PaymentMethod,
      };

      jest
        .spyOn(repository, 'save')
        .mockReturnValue(Promise.resolve(savedTransaction as Transaction));

      const result = await firstValueFrom(
        transactionService.create(createTransactionDto),
      );

      expect(repository.save).toHaveBeenCalledWith({
        remittent: createTransactionDto.remittentUser,
        destinatary: createTransactionDto.destinataryUser,
        project: createTransactionDto.project,
        paymentMethod: createTransactionDto.paymenMethod,
        description: createTransactionDto.description,
        amount: createTransactionDto.amount,
        date: createTransactionDto.date,
        status: createTransactionDto.status,
      });
      expect(result).toEqual(savedTransaction);
    });
  });
});

describe('transactionsservice', () => {
    it('should be defined', () => {
      expect(true).toBe(true);
    });
  });

