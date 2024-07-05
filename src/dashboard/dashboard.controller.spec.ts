describe('DashboardController', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { of } from 'rxjs';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { User } from 'src/user/models/user.interface';
import { UserWithTransactionCount } from './userWithTransactionCount.interface';
import { Project } from './project.interface';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getRecentPayments: jest.fn().mockReturnValue(of([])),
            getAllUsers: jest.fn().mockReturnValue(of([])),
            getTotalAmount: jest.fn().mockReturnValue(of(0)),
            getTopUsers: jest.fn().mockReturnValue(of([])),
            getProjectWithMostTransactions: jest.fn().mockReturnValue(of({})),
            getProjectWithMostAmount: jest.fn().mockReturnValue(of({})),
            getTransactionCountPerDay: jest.fn().mockReturnValue(of({})),
            getTransactionsPerProject: jest.fn().mockReturnValue(of({})),
            getUserofProject: jest.fn().mockReturnValue(of({})),
            getSubscriptionsPerProject: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getRecentPayments with the correct project id', () => {
    const project: Project = { projectid: 1, name: 'test'};
    controller.getRecentPayments(project);
    expect(service.getRecentPayments).toHaveBeenCalledWith(1);
  });

  it('should call getAllUsers with the correct project id', () => {
    const project: Project = { projectid: 1, name: 'test'};
    controller.getAllUsers(project);
    expect(service.getAllUsers).toHaveBeenCalledWith(1);
  });

  it('should call getTotalAmount with the correct project id', () => {
    const project: Project = { projectid: 1, name: 'test'};
    controller.getTotalAmount(project);
    expect(service.getTotalAmount).toHaveBeenCalledWith(1);
  });

  it('should call getTopUsers with the correct project id', () => {
    const project: Project = { projectid: 1, name: 'test'};
    controller.getTopUsers(project);
    expect(service.getTopUsers).toHaveBeenCalledWith(1);
  });

  it('should call getProjectWithMostTransactions', () => {
    controller.getTopProjectAmount();
    expect(service.getProjectWithMostTransactions).toHaveBeenCalled();
  });

  it('should call getProjectWithMostAmount', () => {
    controller.getTopProjectTransaction();
    expect(service.getProjectWithMostAmount).toHaveBeenCalled();
  });

  it('should call getTransactionCountPerDay with the correct project id', () => {
    const project: Project = { projectid: 1, name: 'test'};
    controller.getTransactionCountPerDay(project);
    expect(service.getTransactionCountPerDay).toHaveBeenCalledWith(1);
  });

  it('should call getTransactionsPerProject with the correct project id', () => {
    const project: Project = { projectid: 1, name: 'test'};
    controller.getTransactionsPerProject(project);
    expect(service.getTransactionsPerProject).toHaveBeenCalledWith(1);
  });

  it('should call getUserofProject with the correct project id', () => {
    const project: Project = { projectid: 1, name: 'test'};
    controller.getUserofProject(project);
    expect(service.getUserofProject).toHaveBeenCalledWith(1);
  });

  it('should call getSubscriptionsPerProject with the correct project id', () => {
    const project: Project = { projectid: 1, name: 'test'};
    controller.getSubscriptionsPerProject(project);
    expect(service.getSubscriptionsPerProject).toHaveBeenCalledWith(1);
  });
});
