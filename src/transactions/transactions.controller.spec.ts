import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ValidateTransactionReferencesGuard } from './guards/ValidateReference.guard';
import { ValidateTransactionProprietaryGuard } from './guards/validate-transaction-propertary.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { lastValueFrom, of, firstValueFrom } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeleteResult } from 'typeorm';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: Partial<TransactionsService>;
  let userService: Partial<UserService>;

  beforeEach(async () => {
    transactionsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      finAll: jest.fn(),
      findAllUserTransactions: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };
    userService = {
      decodeToken: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: transactionsService },
        { provide: UserService, useValue: userService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ValidateTransactionReferencesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ValidateTransactionProprietaryGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      const req = {
        user: { user: { userid: 1 } },
        validatedReferences: {
          remittentUser: {
            userid: 6,
            email: 'claudio.user@user.com',
            rut: '36',
            firstname: 'Claudio',
            lastname: 'Mondaca',
            role: [
              {
                roleid: 2,
                name: 'user',
              },
            ],
          },
          destinataryUser: {
            userid: 2,
            email: 'diego.gonzalez07@alumnos.ucn.cl',
            rut: 'nomeloc',
            firstname: 'Diego',
            lastname: 'Gonzales',
            role: [
              {
                roleid: 1,
                name: 'admin',
              },
            ],
          },
          project: {
            projectid: 1,
            name: 'Proyecto De Sistema De pagos',
          },
          paymentMethod: {
            paymentmethodid: 1,
            name: 'Transbank',
          },
        },
        amount: 1000000,
        date: '2023-06-01',
        status: 'vigente',
      };
      const createTransactionDto: CreateTransactionDto = {
        remittentEmail: 'claudio.user@user.com',
        destinataryEmail: 'diego.gonzalez07@alumnos.ucn.cl',
        projectName: 'Proyecto De Sistema De pagos',
        description: 'Subscripción Netflix',
        paymentMethodName: 'Transbank',
        amount: 1000000,
        date: new Date('2023-06-01'),
        status: 'vigente',
      };

      const validTransaction = {
        remittentUser: req.validatedReferences.remittentUser,
        destinataryUser: req.validatedReferences.destinataryUser,
        project: req.validatedReferences.project,
        paymentMethod: req.validatedReferences.paymentMethod,
      };
      const { amount, description, date, status } = createTransactionDto;
      const result = {
        transactionid: 78,
        ...validTransaction,
        amount,
        description,
        date,
        status,
      };

      (transactionsService.create as jest.Mock).mockReturnValue(of(result));

      const response = await lastValueFrom(
        controller.create(req, createTransactionDto),
      );
      expect(response).toEqual(result);
      expect(transactionsService.create).toHaveBeenCalledWith({
        description: createTransactionDto.description,
        amount: createTransactionDto.amount,
        date: createTransactionDto.date,
        status: createTransactionDto.status,
        remittentUser: req.validatedReferences.remittentUser,
        destinataryUser: req.validatedReferences.destinataryUser,
        project: req.validatedReferences.project,
        paymenMethod: req.validatedReferences.paymentMethod,
      });
    });
  });

  describe('findAll', () => {
    it('should return all transactions for an admin', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${process.env.ADMIN_USER_TOKEN}`,
        },
      };
      const decodedToken = {
        userid: 1,
        email: 'claudio.cortes02@alumnos.ucn.cl',
        rut: '20920872-5',
        firstname: 'Claudio',
        lastname: 'Cortés',
        hashedpassword: 'fewrwerwefewrew',
        role: [{ roleid: 1, name: 'admin' }],
      };
      const transactions = [
        {
          transactionid: 32,
          description: 'Mensualidad Hosting',
          amount: 1000000,
          date: '2023-05-31T04:00:00.000Z',
          status: 'vigente',
          project: {
            projectid: 1,
            name: 'Proyecto De Sistema De pagos',
          },
          paymentMethod: {
            paymentmethodid: 1,
            name: 'Transbank',
          },
          remittent: {
            userid: 6,
            email: 'claudio.user@user.com',
            rut: '36',
            firstname: 'Claudio',
            lastname: 'Mondaca',
          },
          destinatary: {
            userid: 2,
            email: 'diego.gonzalez07@alumnos.ucn.cl',
            rut: 'nomeloc',
            firstname: 'Diego',
            lastname: 'Gonzales',
          },
        },
        {
          transactionid: 33,
          description: 'Mensualidad Hosting',
          amount: 1000000,
          date: '2023-05-31T04:00:00.000Z',
          status: 'vigente',
          project: {
            projectid: 1,
            name: 'Proyecto De Sistema De pagos',
          },
          paymentMethod: {
            paymentmethodid: 1,
            name: 'Transbank',
          },
          remittent: {
            userid: 6,
            email: 'claudio.user@user.com',
            rut: '36',
            firstname: 'Claudio',
            lastname: 'Mondaca',
          },
          destinatary: {
            userid: 2,
            email: 'diego.gonzalez07@alumnos.ucn.cl',
            rut: 'nomeloc',
            firstname: 'Diego',
            lastname: 'Gonzales',
          },
        },
      ];

      (userService.decodeToken as jest.Mock).mockReturnValue(of(decodedToken));
      (userService.findByEmail as jest.Mock).mockReturnValue(of(decodedToken));
      (transactionsService.finAll as jest.Mock).mockReturnValue(
        Promise.resolve(transactions),
      );

      const response = await controller.findAll(req);
      console.log(response, 'response');
      expect(response).toEqual(transactions);
      expect(transactionsService.finAll).toHaveBeenCalled();
    });

    it('should return user transactions', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${process.env.NORMAL_USER_TOKEN}`,
        },
      };
      const user = {
        userid: 6,
        email: 'claudio.user@user.com',
        rut: '36',
        firstname: 'Claudio',
        lastname: 'Mondaca',
        role: [
          {
            roleid: 2,
            name: 'user',
          },
        ],
      };
      const transactions = [
        {
          transactionid: 32,
          description: 'Mensualidad Hosting',
          amount: 1000000,
          date: '2023-05-31T04:00:00.000Z',
          status: 'vigente',
          project: {
            projectid: 1,
            name: 'Proyecto De Sistema De pagos',
          },
          paymentMethod: {
            paymentmethodid: 1,
            name: 'Transbank',
          },
          remittent: {
            userid: 6,
            email: 'claudio.user@user.com',
            rut: '36',
            firstname: 'Claudio',
            lastname: 'Mondaca',
          },
          destinatary: {
            userid: 2,
            email: 'diego.gonzalez07@alumnos.ucn.cl',
            rut: 'nomeloc',
            firstname: 'Diego',
            lastname: 'Gonzales',
          },
        },
        {
          transactionid: 33,
          description: 'Mensualidad Hosting',
          amount: 1000000,
          date: '2023-05-31T04:00:00.000Z',
          status: 'vigente',
          project: {
            projectid: 1,
            name: 'Proyecto De Sistema De pagos',
          },
          paymentMethod: {
            paymentmethodid: 1,
            name: 'Transbank',
          },
          remittent: {
            userid: 6,
            email: 'claudio.user@user.com',
            rut: '36',
            firstname: 'Claudio',
            lastname: 'Mondaca',
          },
          destinatary: {
            userid: 2,
            email: 'diego.gonzalez07@alumnos.ucn.cl',
            rut: 'nomeloc',
            firstname: 'Diego',
            lastname: 'Gonzales',
          },
        },
      ];
      (userService.decodeToken as jest.Mock).mockReturnValue(
        of({
          userid: 6,
          email: 'claudio.user@user.com',
        }),
      );
      (userService.findByEmail as jest.Mock).mockReturnValue(of(user));
      (
        transactionsService.findAllUserTransactions as jest.Mock
      ).mockReturnValue(Promise.resolve(transactions));

      expect(await controller.findAll(req)).toEqual(transactions);
    });
  });

  describe('remove', () => {
    it('should remove a transaction', async () => {
      const transactionId = 1;
      const deleteResult: DeleteResult = {
        affected: 1,
        raw: [],
      };

      (transactionsService.remove as jest.Mock).mockReturnValue(
        Promise.resolve(deleteResult),
      );

      const result = await controller.remove(transactionId);

      expect(transactionsService.remove).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const transactionId = 1;
      const updateTransactionDto: UpdateTransactionDto = {
        description: 'Updated Description',
        amount: 2000,
        date: new Date(),
        status: 'updated',
      };
      const updatedTransaction = {
        transactionid: transactionId,
        ...updateTransactionDto,
        remittent: {
          userid: 1,
          email: 'remittent@test.com',
          firstname: 'John',
          lastname: 'Doe',
        },
        destinatary: {
          userid: 2,
          email: 'destinatary@test.com',
          firstname: 'Jane',
          lastname: 'Doe',
        },
        project: { projectid: 1, name: 'Test Project' },
        paymentMethod: { paymentmethodid: 1, name: 'Test Payment Method' },
      };

      (transactionsService.update as jest.Mock).mockReturnValue(
        of(updatedTransaction),
      );

      const req = { user: { user: { userid: 1, email: 'user@test.com' } } };
      const result = await firstValueFrom(
        controller.update(req, transactionId, updateTransactionDto),
      );

      expect(transactionsService.update).toHaveBeenCalledWith(
        1,
        transactionId,
        updateTransactionDto,
      );
      expect(result).toEqual(updatedTransaction);
    });
  });
  describe('findOne', () => {
    it('should find one transaction', async () => {
      const transactionId = 1;
      const transaction = {
        transactionid: transactionId,
        description: 'Test Transaction',
        amount: 1000,
        date: new Date(),
        status: 'pending',
        remittent: {
          userid: 1,
          email: 'remittent@test.com',
          firstname: 'John',
          lastname: 'Doe',
        },
        destinatary: {
          userid: 2,
          email: 'destinatary@test.com',
          firstname: 'Jane',
          lastname: 'Doe',
        },
        project: { projectid: 1, name: 'Test Project' },
        paymentMethod: { paymentmethodid: 1, name: 'Test Payment Method' },
      };

      (transactionsService.findOne as jest.Mock).mockReturnValue(
        of(transaction),
      );

      const result = await controller.findOne(transactionId).toPromise();

      expect(transactionsService.findOne).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual(transaction);
    });
  });
});
