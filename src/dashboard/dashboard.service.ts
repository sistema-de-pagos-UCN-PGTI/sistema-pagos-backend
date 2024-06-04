import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, forkJoin, from, map, switchMap } from 'rxjs';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { User } from 'src/user/models/user.interface';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { UserWithTransactionCount } from './userWithTransactionCount.interface';

@Injectable()
export class DashboardService {
    constructor(@InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private userService: UserService,
    ) {}

    getRecentPayments(): Observable<Transaction[]> {
        return from(this.transactionRepository.find({
            order: {
                date: 'DESC',
            }
        }));
    }

    getAllUsers(): Observable<User[]> {
        return from(this.userService.findAll());
    }

    getTotalAmount(): Observable<number> {
        return from(this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('EXTRACT(MONTH FROM transaction.date) = EXTRACT(MONTH FROM CURRENT_DATE)')
            .getRawOne())
            .pipe(
                map((result) => result.total)
            );
    }

    getTopUsers(): Observable<UserWithTransactionCount[]> {
        return from(this.transactionRepository
            .createQueryBuilder('transaction')
            .select('transaction.destinataryid')
            .addSelect('COUNT(transaction.destinataryid)', 'total')
            .groupBy('transaction.destinataryid')
            .orderBy('total', 'DESC')
            .limit(5)
            .getRawMany())
            .pipe(
                switchMap((result) => {
                    const userObservables = result.map((item) => 
                        this.userService.findOne(item.destinataryid).pipe(
                            map(user => ({
                                user,
                                total: parseInt(item.total, 10)
                            } as UserWithTransactionCount))
                        )
                    );
                    return forkJoin(userObservables);
                })
            );
    }

    //project with the most transactions and the total amount of transactions
    getProjectWithMostTransactions(): Observable<any> {
        return from(this.transactionRepository
            .createQueryBuilder('transaction')
            .select('transaction.projectid')
            .addSelect('COUNT(transaction.projectid)', 'total')
            .groupBy('transaction.projectid')
            .orderBy('total', 'DESC')
            .limit(1)
            .getRawOne())
            .pipe(
                switchMap((result) => {
                    return from(this.transactionRepository
                        .createQueryBuilder('transaction')
                        .select('SUM(transaction.amount)', 'total')
                        .where('transaction.projectid = :projectid', { projectid: result.projectid })
                        .getRawOne())
                        .pipe(
                            map((amount) => ({
                                projectid: result.projectid,
                                projectName: result.name,
                                total: parseInt(result.total, 10),
                                amount: parseInt(amount.total, 10)
                            })
                        )
                    );
                })
            );
    }

    //project with most total amount
    getProjectWithMostAmount(): Observable<any> {
        return from(this.transactionRepository
            .createQueryBuilder('transaction')
            .select('transaction.projectid')
            .addSelect('SUM(transaction.amount)', 'total')
            .groupBy('transaction.projectid')
            .orderBy('total', 'DESC')
            .limit(1)
            .getRawOne())
            .pipe(
                switchMap((result) => {
                    return from(this.transactionRepository
                        .createQueryBuilder('transaction')
                        .select('project.name')
                        .from('projects', 'project')
                        .where('transaction.projectid = :projectid', { projectid: result.projectid })
                        .getRawOne())
                        .pipe(
                            map((project) => ({
                                projectid: result.projectid,
                                projectName: project.name,
                                total: parseInt(result.total, 10)
                            })
                        )
                    );
                })
            );
    }

    //get count of transactions per day in the current month
    getTransactionCountPerDay(): Observable<any> {
        return from(this.transactionRepository
            .createQueryBuilder('transaction')
            .select('EXTRACT(DAY FROM transaction.date)', 'day')
            .addSelect('COUNT(transaction.transactionid)', 'total')
            .where('EXTRACT(MONTH FROM transaction.date) = EXTRACT(MONTH FROM CURRENT_DATE)')
            .groupBy('day')
            .orderBy('day')
            .getRawMany());
    }
    


}
