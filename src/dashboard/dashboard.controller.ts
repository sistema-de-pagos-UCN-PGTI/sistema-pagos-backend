import { Body, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Observable } from 'rxjs';
import { User } from 'src/user/models/user.interface';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserWithTransactionCount } from './userWithTransactionCount.interface';
import { Project } from './project.interface';

@Controller('dashboard')
export class DashboardController {
    constructor(private dashboardService: DashboardService) {}

    @hasRoles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('getRecentPayments')
    getRecentPayments(): Observable<Transaction[]>{
        return this.dashboardService.getRecentPayments();
    }

    @hasRoles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('getAllUsers')
    getAllUsers(): Observable<User[]>{
        return this.dashboardService.getAllUsers();
    }

    @hasRoles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('getTotalAmount')
    getTotalAmount(@Body() project: Project): Observable<number>{
        return this.dashboardService.getTotalAmount(Number(project.projectid));
    }

    @hasRoles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('getTopUsers')
    getTopUsers(@Body() project: Project): Observable<UserWithTransactionCount[]>{
        return this.dashboardService.getTopUsers(Number(project.projectid));
    }

    @hasRoles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('getTopProjectTransaction')
    getTopProjectAmount(): Observable<any>{
        return this.dashboardService.getProjectWithMostTransactions();
    }

    @hasRoles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('getTopProjectAmount')
    getTopProjectTransaction(): Observable<any>{
        return this.dashboardService.getProjectWithMostAmount();
    }

    @hasRoles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('getTransactionCountPerDay')
    getTransactionCountPerDay(): Observable<any>{
        return this.dashboardService.getTransactionCountPerDay();
    }
}
