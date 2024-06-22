
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ValidateTransactionReferencesGuard } from 'src/transactions/guards/ValidateReference.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ValidSubscriptionReferencesDto } from './dto/valid-references.dto';
import { ValidReferencesDto } from 'src/transactions/dto/valid-references.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { of, firstValueFrom } from 'rxjs';
import { SubscriptionPlan } from './entities/subcriptionPlans.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { ProjectsService } from 'src/projects/projects.service';
import { Users } from 'src/user/models/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { Project } from 'src/projects/entities/project.entity';
import { JwtService } from '@nestjs/jwt';
import { PaymentMethod } from 'src/payment-method/entities/paymentMethod.entity';
import { ConfigModule } from '@nestjs/config';
import { verify } from 'crypto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import exp from 'constants';

describe('SubscriptionController', () => {
  let subscriptionController: SubscriptionController;
  let subscriptionService: Partial<SubscriptionService>;
  let userService: Partial<UserService>;
  let jwtService: Partial<JwtService>;
  const subscriptions = [
    {
      subscriptionplanid: 12,
      description: 'Mensualidad Hosting',
      amount: 1000000,
      startdate: new Date('2024-05-31T04:00:00.000Z'), // Cambiado a Date
      periodicity: 'daily',
      status: 'vigente',
      lastpaydate: new Date('2024-06-07'), // Cambiado a Date
      project: {
        projectid: 1,
        name: 'Proyecto De Sistema De pagos',
        transactions: [],
        subscriptionPlans: [],
      },
      paymentmethod: {
        paymentmethodid: 1,
        name: 'Transbank',
        transactions: [], // Add transactions property
        subscriptionPlans: [], // Add subscriptionPlans property
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
  beforeEach(async () => {
    userService = {
      decodeToken: jest.fn(),
      findByEmail: jest.fn(),
    };
    subscriptionService = {
      findAllForUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [SubscriptionController],
      providers: [
        SubscriptionService,
        { provide: UserService, useValue: userService },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useClass: Repository,
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Project),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PaymentMethod),
          useClass: Repository,
        },
        JwtService,
        TransactionsService,
        ProjectsService,
        UserService,
        AuthService,
        PaymentMethodService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    subscriptionController = module.get<SubscriptionController>(
      SubscriptionController,
    );
    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(subscriptionController).toBeDefined();
  });

  describe('create', () => {
    it('should create a subscription', async () => {
      const createSubscriptionDto: CreateSubscriptionDto = {
        remittentEmail: 'claudio.user@user.com',
        destinataryEmail: 'diego.gonzalez07@alumnos.ucn.cl',
        projectName: 'Proyecto De Sistema De pagos',
        description: 'Subscripción A AmazonWebVideo by admin',
        paymentMethodName: 'Transbank',
        amount: 1000000,
        date: new Date('2023-06-01'),
        status: 'vigente',
        periodicity: 'daily',
      };

      const validReferences: ValidReferencesDto = {
        remittentUser: { userid: 1, email: 'claudio.user@user.com' },
        destinataryUser: {
          userid: 2,
          email: 'diego.gonzalez07@alumnos.ucn.cl',
        },
        project: {
          projectid: 1,
          name: 'Proyecto De Sistema De pagos',
          subscriptionPlans: [],
          transactions: [],
        },
        paymentMethod: {
          paymentmethodid: 1,
          name: 'Transbank',
          subscriptionPlans: [],
          transactions: [],
        },
      };

      const validSubscription: ValidSubscriptionReferencesDto = {
        description: createSubscriptionDto.description,
        amount: createSubscriptionDto.amount,
        startDate: createSubscriptionDto.date,
        status: createSubscriptionDto.status,
        periodicity: createSubscriptionDto.periodicity,
        remittentUser: validReferences.remittentUser,
        destinataryUser: validReferences.destinataryUser,
        project: validReferences.project,
        paymentmethod: validReferences.paymentMethod,
      };

      const req = {
        validatedReferences: validReferences,
      };

      // Simulación del método create en el servicio
      jest
        .spyOn(subscriptionService, 'create')
        .mockReturnValue(of(validSubscription as any));

      await subscriptionController.create(req, createSubscriptionDto);

      expect(subscriptionService.create).toHaveBeenCalledWith(
        validSubscription,
      );
    });
  });
  describe('findAll', () => {
    it('should return all subscriptions for an admin', async () => {
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

      jest.spyOn(userService, 'decodeToken').mockReturnValue(of(decodedToken));
      jest.spyOn(userService, 'findByEmail').mockReturnValue(of(decodedToken));

      jest
        .spyOn(subscriptionService, 'findAll')
        .mockResolvedValue(subscriptions);

      const response = await subscriptionController.findAll(req);
      expect(response).toEqual(subscriptions);
      expect(subscriptionService.findAll).toHaveBeenCalled();
    });
    it('should return user subscriptions', async () => {
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

      jest.spyOn(userService, 'decodeToken').mockReturnValue(of(user));
      jest.spyOn(userService, 'findByEmail').mockReturnValue(of(user));

      jest
        .spyOn(subscriptionService, 'findAllForUser')
        .mockResolvedValue(subscriptions);

      const response = await subscriptionController.findAll(req);
      expect(response).toEqual(subscriptions);
      expect(subscriptionService.findAllForUser).toHaveBeenCalled();
    });
  });
  describe('findOne', () => {
    it('Should Find One Subscription', async () => {
      const subscriptionId = 1;
      const subscription = subscriptions[0];

      const findOneMock = jest.spyOn(subscriptionService, 'findOne');
      findOneMock.mockReturnValue(of(subscription));

      const result = await firstValueFrom(
        subscriptionController.findOne(subscriptionId),
      );

      expect(findOneMock).toHaveBeenCalledWith(subscriptionId);
      expect(result).toEqual(subscription);
    });
  });
  describe('update', () => {
    it('Should Update Subscription', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${process.env.ADMIN_USER_TOKEN}`,
        },
      };
      const subscriptionId = 1;
      const updatedSubscriptionDTO: UpdateSubscriptionDto = {
        description: 'Updated Description',
        amount: 2000,
        date: new Date(),
        status: 'updated',
        periodicity: 'mensual',
      };

      const updatedSubscription: SubscriptionPlan = {
        subscriptionplanid: 12,
        description: 'Mensualidad Hosting',
        amount: 1000000,
        startdate: new Date('2024-05-31T04:00:00.000Z'),
        periodicity: 'daily',
        status: 'vigente',
        lastpaydate: new Date('2024-06-07'),
        project: {
          projectid: 1,
          name: 'Proyecto De Sistema De pagos',
          transactions: [],
          subscriptionPlans: [],
        },
        paymentmethod: {
          paymentmethodid: 1,
          name: 'Transbank',
          transactions: [],
          subscriptionPlans: [],
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
      jest.spyOn(userService, 'decodeToken').mockReturnValue(of(decodedToken));
      jest.spyOn(userService, 'findByEmail').mockReturnValue(of(decodedToken));

      const updateMock = jest.spyOn(subscriptionService, 'update');
      updateMock.mockReturnValue(of(updatedSubscription));

      const resultObservable = await subscriptionController.update(
        req,
        subscriptionId,
        updatedSubscriptionDTO,
      );

      const result = await firstValueFrom(resultObservable);

      expect(updateMock).toHaveBeenCalledWith(
        decodedToken.userid, // Añade el userId esperado aquí
        subscriptionId,
        updatedSubscriptionDTO,
      );
      expect(result).toEqual(updatedSubscription);
    });
  });
  describe('remove', () => {
    it('Should Remove a Subscription', async () => {
      const subscriptionId = 1;
      const deleteResult: DeleteResult = {
        affected: 1,
        raw: [],
      };
      const removeMock = jest.spyOn(subscriptionService, 'remove');
      removeMock.mockReturnValue(of(deleteResult));

      const resultObservable =
        await subscriptionController.remove(subscriptionId);

      const result = await firstValueFrom(resultObservable);
      expect(removeMock).toHaveBeenCalledWith(subscriptionId);
      expect(result).toEqual(deleteResult);
    });
  });
});

describe('SubscriptionController', () => {
    it('should be defined', () => {
      expect(true).toBe(true);
    });
  });
  
>>>>>>> main
