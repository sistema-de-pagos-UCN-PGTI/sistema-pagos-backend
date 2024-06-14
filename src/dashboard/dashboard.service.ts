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
            },
            relations: ['remittent', 'destinatary', 'project', 'paymentMethod'],
            take: 5,
        })).pipe(
            map((transactions) => transactions.map((transaction) => {
                delete transaction.remittent.hashedpassword;
                delete transaction.destinatary.hashedpassword;
                return transaction;
            }))
        );
    }

    getAllUsers(): Observable<User[]> {
        return from(this.userService.findAll());
    }

    getTotalAmount(projectid: Number): Observable<number> {
        return from(this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')         
            .where('EXTRACT(MONTH FROM transaction.date) = EXTRACT(MONTH FROM CURRENT_DATE)')
            .andWhere('transaction.projectid = :projectid', { projectid })
            .getRawOne())
            .pipe(
                map((result) => result.total)
            );
    }

    getTopUsers(projectid: Number): Observable<UserWithTransactionCount[]> {
        return from(this.transactionRepository
            .createQueryBuilder('transaction')
            .select('transaction.remittentid')
            .addSelect('COUNT(transaction.remittentid)', 'total')
            .where('transaction.projectid = :projectid', { projectid })
            .groupBy('transaction.remittentid')
            .orderBy('total', 'DESC')
            .limit(3)
            .getRawMany())
            .pipe(
                switchMap((result) => {
                    const userObservables = result.map((item) => 
                        this.userService.findOne(item.remittentid).pipe(
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

    //get count of transactions per day in the current month per project
    getTransactionCountPerDay(): Observable<any> {
        return from(this.transactionRepository
            .createQueryBuilder('transaction')
            .select('EXTRACT(DAY FROM transaction.date)', 'day')
            .addSelect('COUNT(transaction.transactionid)', 'total')
            .addSelect('transaction.projectid')
            .addSelect('project.name')
            .innerJoin('projects', 'project', 'transaction.projectid = project.projectid')
            .where('EXTRACT(MONTH FROM transaction.date) = EXTRACT(MONTH FROM CURRENT_DATE)')
            .groupBy('day, transaction.projectid, project.name')
            .orderBy('day')
            .getRawMany());
    }
    


}
