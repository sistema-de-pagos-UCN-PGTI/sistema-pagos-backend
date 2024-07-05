describe('DashboardService', () => {
    it('should be defined', () => {
      expect(true).toBe(true);
    });
  });
  import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { UserService } from 'src/user/user.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { Repository } from 'typeorm';
import { of } from 'rxjs';
import { User } from 'src/user/models/user.interface';

describe('DashboardService', () => {
  let service: DashboardService;
  let transactionRepository: Repository<Transaction>;
  let userService: UserService;
  let subscriptionService: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Transaction),
          useClass: Repository,
          useValue: {
            find: jest.fn(),
            createQueryBuilder: () => ({
              select: jest.fn(),
              addSelect: jest.fn(),
              where: jest.fn(),
              andWhere: jest.fn(),
              groupBy: jest.fn(),
              orderBy: jest.fn(),
              limit: jest.fn(),
              getRawOne: jest.fn(),
              getRawMany: jest.fn(),
            }),
            addSelect: jest.fn(),
            select: jest.fn(),
            where: jest.fn(),
            andWhere: jest.fn(),
            groupBy: jest.fn(),
            orderBy: jest.fn(),
            limit: jest.fn(),
            getRawOne: jest.fn(),
            getRawMany: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findUsersByProject: jest.fn().mockReturnValue(of([])),
            findOne: jest.fn().mockReturnValue(of({} as User)),
          },
        },
        {
          provide: SubscriptionService,
          useValue: {
            findSubscriptionsByProject: jest.fn().mockReturnValue(of([])),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    userService = module.get<UserService>(UserService);
    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecentPayments', () => {
    it('should return recent payments', done => {
      const projectid = 1;
      const transactions = [
        { remittent: { hashedpassword: 'hash1' }, destinatary: { hashedpassword: 'hash2' } },
      ];
      jest.spyOn(transactionRepository, 'find').mockReturnValue(Promise.resolve(transactions) as any);
      
      service.getRecentPayments(projectid).subscribe(result => {
        expect(result).toEqual([{ remittent: {}, destinatary: {} }]);
        done();
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', done => {
      const projectid = 1;
      service.getAllUsers(projectid).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getTotalAmount', () => {
    it('should return total amount', done => {
      const projectid = 1;
      jest.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: 100 }),
      } as any);

      service.getTotalAmount(projectid).subscribe(result => {
        expect(result).toBe(100);
        done();
      });
    });
  });

  describe('getTopUsers', () => {
    it('should return top users', done => {
      const projectid = 1;
      const userWithTransactionCount = [{ user: {}, total: 1 }];
      jest.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ remittentid: 1, total: '1' }]),
      } as any);
      jest.spyOn(userService, 'findOne').mockReturnValue(of({} as User));

      service.getTopUsers(projectid).subscribe(result => {
        expect(result).toEqual(userWithTransactionCount);
        done();
      });
    });
  });

  describe('getProjectWithMostTransactions', () => {
    it('should return project with most transactions', done => {
      const project = { projectid: 1, total: '10', name: 'Project 1' };
      jest.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ projectid: 1, total: '10' }),
      } as any);

      jest.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '100' }),
      } as any);

      service.getProjectWithMostTransactions().subscribe(result => {
        expect(result).toEqual({
          projectid: 1,
          projectName: undefined,
          total: 10,
          amount: 100,
        });
        done();
      });
    });
  });

  describe('getProjectWithMostAmount', () => {
    it('should return project with most amount', done => {
      const project = { projectid: 1, total: '100' };
      jest.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(project),
      } as any);

      jest.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ name: 'Project 1' }),
      } as any);

      service.getProjectWithMostAmount().subscribe(result => {
        expect(result).toEqual({
          projectid: 1,
          projectName: 'Project 1',
          total: 100,
        });
        done();
      });
    });
  });

  describe('getTransactionCountPerDay', () => {
    it('should return transaction count per day', done => {
      const projectid = 1;
      const transactions = [{ day: 1, total: 10, projectid: 1, name: 'Project 1' }];
      jest.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(transactions),
      } as any);

      service.getTransactionCountPerDay(projectid).subscribe(result => {
        expect(result).toEqual(transactions);
        done();
      });
    });
  });

  describe('getTransactionsPerProject', () => {
    it('should return transactions per project', done => {
      const projectid = 1;
      const transactions = [
        { remittent: { hashedpassword: 'hash1' }, destinatary: { hashedpassword: 'hash2' } },
      ];
      jest.spyOn(transactionRepository, 'find').mockReturnValue(Promise.resolve(transactions) as any);

      service.getTransactionsPerProject(projectid).subscribe(result => {
        expect(result).toEqual([{ remittent: {}, destinatary: {} }]);
        done();
      });
    });
  });

  describe('getUserofProject', () => {
    it('should return users of project', done => {
      const projectid = 1;
      service.getUserofProject(projectid).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getSubscriptionsPerProject', () => {
    it('should return subscriptions per project', done => {
      const projectid = 1;
      service.getSubscriptionsPerProject(projectid).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
