import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Observable } from 'rxjs';
import { User } from 'src/user/models/user.interface';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserWithTransactionCount } from './userWithTransactionCount.interface';
import { Project } from './project.interface';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('getRecentPayments')
  getRecentPayments(@Body() project: Project): Observable<Transaction[]> {
    return this.dashboardService.getRecentPayments(Number(project.projectid));
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('getAllUsers')
  getAllUsers(@Body() project: Project): Observable<User[]> {
    return this.dashboardService.getAllUsers(Number(project.projectid));
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('getTotalAmount')
  getTotalAmount(@Body() project: Project): Observable<number> {
    return this.dashboardService.getTotalAmount(Number(project.projectid));
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('getTopUsers')
  getTopUsers(
    @Body() project: Project,
  ): Observable<UserWithTransactionCount[]> {
    return this.dashboardService.getTopUsers(Number(project.projectid));
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('getTopProjectTransaction')
  getTopProjectAmount(): Observable<any> {
    return this.dashboardService.getProjectWithMostTransactions();
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('getTopProjectAmount')
  getTopProjectTransaction(): Observable<any> {
    return this.dashboardService.getProjectWithMostAmount();
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('getTransactionCountPerDay')
  getTransactionCountPerDay(@Body() project: Project): Observable<any> {
    return this.dashboardService.getTransactionCountPerDay(
      Number(project.projectid),
    );
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('transactionsperproject')
  getTransactionsPerProject(@Body() project: Project): Observable<any> {
    return this.dashboardService.getTransactionsPerProject(
      Number(project.projectid),
    );
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('getUserofProject')
  getUserofProject(@Body() project: Project): Observable<any> {
    return this.dashboardService.getUserofProject(Number(project.projectid));
  }

  @hasRoles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('getSubscriptionsPerProject')
  getSubscriptionsPerProject(@Body() project: Project): Observable<any> {
    return this.dashboardService.getSubscriptionsPerProject(
      Number(project.projectid),
    );
  }
}
