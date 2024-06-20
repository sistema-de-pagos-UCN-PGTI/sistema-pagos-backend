import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ValidateTransactionReferencesGuard } from './guards/ValidateReference.guard';
import { ValidateTransactionProprietaryGuard } from './guards/validate-transaction-propertary.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { of } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: Partial<TransactionsService>;
  let userService: Partial<UserService>;

  beforeEach(async () => {
    transactionsService = {
      create: jest.fn(),
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
      const { amount, description, date, status, ...data } =
        createTransactionDto;
      const result = {
        transactionid: 78,
        ...validTransaction,
        amount,
        description,
        date,
        status,
      };

      (transactionsService.create as jest.Mock).mockReturnValue(of(result));

      expect(await controller.create(req, createTransactionDto)).toEqual(
        result,
      );
      expect(transactionsService.create).toHaveBeenCalledWith(
        req.validatedReferences,
        amount,
        description,
        date,
        status,
      );
    });
  });

  describe('findAll', () => {
    it('should return all transactions for an admin', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${process.env.ADMIN_USER_TOKEN}`,
        },
      };
      const user = { userid: 1, role: [{ name: 'admin' }] };
      const transactions = [{ id: 1, description: 'Test Transaction' }];

      (userService.decodeToken as jest.Mock).mockReturnValue(
        of({ email: 'claudio.cortes02@alumnos.ucn.cl' }),
      );
      (userService.findByEmail as jest.Mock).mockReturnValue(of(user));
      (transactionsService.finAll as jest.Mock).mockReturnValue(
        of(transactions),
      );

      expect(await controller.findAll(req)).toEqual(transactions);
    });

    it('should return user transactions', async () => {
      const req = {
        headers: {
          authorization: 'Bearer token',
        },
      };
      const user = { userid: 2, role: [{ name: 'user' }] };
      const transactions = [{ id: 1, description: 'Test Transaction' }];

      (userService.decodeToken as jest.Mock).mockReturnValue(
        of({ email: 'user@test.com' }),
      );
      (userService.findByEmail as jest.Mock).mockReturnValue(of(user));
      (
        transactionsService.findAllUserTransactions as jest.Mock
      ).mockReturnValue(of(transactions));

      expect(await controller.findAll(req)).toEqual(transactions);
    });
  });

  describe('remove', () => {
    it('should remove a transaction', async () => {
      const transactionId = 1;
      const result = { affected: 1 };

      (transactionsService.remove as jest.Mock).mockReturnValue(of(result));

      expect(await controller.remove(transactionId)).toEqual(result);
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const req = {
        user: { user: { userid: 1 } },
      };
      const transactionId = 1;
      const updateTransactionDto = { description: 'Updated Transaction' };
      const result = { id: 1, ...updateTransactionDto };

      (transactionsService.update as jest.Mock).mockReturnValue(of(result));

      expect(
        await controller.update(req, transactionId, updateTransactionDto),
      ).toEqual(result);
    });
  });
});
