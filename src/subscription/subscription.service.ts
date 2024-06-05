import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionPlan } from './entities/subcriptionPlans.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { ValidTransactionsReferencesDto } from 'src/transactions/dto/valid-transactions-references.dto';
import {
  Observable,
  catchError,
  from,
  map,
  mergeMap,
  switchMap,
  throwError,
} from 'rxjs';
import { ValidSubscriptionReferencesDto } from './dto/valid-references.dto';
import { User } from 'src/user/models/user.interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionRepository: Repository<SubscriptionPlan>,
    private transactionService: TransactionsService,
    private userService: UserService,
  ) {}
  create(
    createSubscription: ValidSubscriptionReferencesDto,
  ): Observable<SubscriptionPlan> {
    const newSubscription = {
      remittent: createSubscription.remittentUser,
      destinatary: createSubscription.destinataryUser,
      project: createSubscription.project,
      paymentmethod: createSubscription.paymentmethod,
      description: createSubscription.description,
      lastpayday: null,
      amount: createSubscription.amount,
      startdate: createSubscription.startDate,
      periodicity: createSubscription.periodicity,
      status: createSubscription.status,
    };
    return from(this.subscriptionRepository.save(newSubscription)).pipe(
      map((savedSubscription) => {
        // Eliminar propiedades hashedpassword
        if (savedSubscription.remittent) {
          delete savedSubscription.remittent.hashedpassword;
        }
        if (savedSubscription.destinatary) {
          delete savedSubscription.destinatary.hashedpassword;
        }

        return savedSubscription;
      }),
    );
  }
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleCron() {
    await this.handleSubscriptionTransactions();
  }
  private handleSubscriptionTransactions(): Observable<void> {
    return from(
      this.subscriptionRepository.find({
        where: { status: 'vigente' },
        relations: ['remittent', 'destinatary', 'project', 'paymentmethod'],
      }),
    ).pipe(
      switchMap((activeSubscriptions) => {
        const now = new Date();
        return from(activeSubscriptions).pipe(
          mergeMap((sub) => {
            const {
              subscriptionplanid,
              periodicity,
              startdate,
              amount,
              remittent,
              destinatary,
              project,
              paymentmethod,
              lastpaydate,
            } = sub;
            const newTransaction: ValidTransactionsReferencesDto = {
              description: `Subscription transaction for ${subscriptionplanid}`,
              amount: amount,
              date: now,
              status: 'completed',
              remittentUser: remittent,
              destinataryUser: destinatary,
              project,
              paymenMethod: paymentmethod,
            };
            if (!lastpaydate) {
              return this.transactionService.create(newTransaction).pipe(
                switchMap(() => {
                  sub.lastpaydate = now;
                  return from(this.subscriptionRepository.save(sub));
                }),
                map(() => undefined),
              );
            }
            let soonTransactionDate = new Date(lastpaydate);

            switch (periodicity) {
              case 'daily':
                soonTransactionDate.setDate(soonTransactionDate.getDate() + 1);
                break;
              case 'weekly':
                soonTransactionDate.setDate(soonTransactionDate.getDate() + 7);
                break;
              case 'monthly':
                soonTransactionDate.setMonth(
                  soonTransactionDate.getMonth() + 1,
                );
                break;
              case 'quarterly':
                soonTransactionDate.setMonth(
                  soonTransactionDate.getMonth() + 4,
                );
                break;
              case 'semiannual':
                soonTransactionDate.setMonth(
                  soonTransactionDate.getMonth() + 6,
                );
                break;
              case 'yearly':
                soonTransactionDate.setFullYear(
                  soonTransactionDate.getFullYear() + 1,
                );
                break;
            }

            if (now >= soonTransactionDate) {
              return this.transactionService.create(newTransaction).pipe(
                switchMap(() => {
                  sub.lastpaydate = now;
                  return from(this.subscriptionRepository.save(sub));
                }),
                map(() => undefined),
              );
            } else {
              return from([]);
            }
          }),
        );
      }),
      map(() => undefined),
    );
  }
  async findAll() {
    const subscriptions = await this.subscriptionRepository.find({
      relations: ['remittent', 'destinatary', 'project', 'paymentmethod'],
    });
    // Remove hashedpassword from remittent and destinatary
    return subscriptions.map((subscription) => {
      const { remittent, destinatary, ...rest } = subscription;
      if (remittent) {
        delete remittent.hashedpassword;
      }
      if (destinatary) {
        delete destinatary.hashedpassword;
      }
      return { ...rest, remittent, destinatary };
    });
  }
  async findAllForUser(user: User) {
    const subscriptions = await this.subscriptionRepository.find({
      where: [{ remittent: user }, { destinatary: user }],
      relations: ['remittent', 'destinatary', 'project', 'paymentmethod'],
    });

    // Remove hashedpassword from remittent and destinatary
    return subscriptions.map((subscription) => {
      const { remittent, destinatary, ...rest } = subscription;
      if (remittent) {
        delete remittent.hashedpassword;
      }
      if (destinatary) {
        delete destinatary.hashedpassword;
      }
      return { ...rest, remittent, destinatary };
    });
  }
  findOne(subscriptionplanid: number): Observable<SubscriptionPlan> {
    return from(
      this.subscriptionRepository.findOne({
        where: { subscriptionplanid },
        relations: ['remittent', 'destinatary', 'project', 'paymentmethod'],
      }),
    ).pipe(
      map((subscription) => {
        if (subscription) {
          const { remittent, destinatary, ...rest } = subscription;

          if (remittent) {
            delete remittent.hashedpassword;
          }
          if (destinatary) {
            delete destinatary.hashedpassword;
          }
          return { ...rest, remittent, destinatary } as SubscriptionPlan;
        }
        return null;
      }),
    );
  }
  update(
    userId: number,
    subscriptionplanid: number,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Observable<SubscriptionPlan> {
    return this.userService.findOne(userId).pipe(
      switchMap((user: User) => {
        if (
          !user.role.some((role) => role.name === 'admin') &&
          updateSubscriptionDto.hasOwnProperty('remittentEmail')
        ) {
          return throwError(
            () =>
              new BadRequestException(
                'Modification of remittentEmail is not allowed',
              ),
          );
        }

        return from(
          this.subscriptionRepository.findOne({
            where: { subscriptionplanid },
          }),
        ).pipe(
          switchMap((subscription) => {
            if (!subscription) {
              return throwError(
                () => new NotFoundException('Subscription not found'),
              );
            }
            Object.assign(subscription, updateSubscriptionDto);
            console.log(subscription);
            return from(this.subscriptionRepository.save(subscription));
          }),
          catchError((error) => throwError(() => error)),
        );
      }),
    );
  }

  remove(subscriptionplanid: number) {
    return from(this.subscriptionRepository.delete({ subscriptionplanid }));
  }
}

//con promesas   private async handleSubscriptionTransactions() {
//   const activeSubscriptions = await this.subscriptionRepository.find({
//     where: { status: true },
//     relations: ['remittent', 'destinatary', 'project', 'paymentmethod'],
//   });
//   const now = new Date();
//   for (const sub of activeSubscriptions) {
//     const {
//       susbscriptionplanid,
//       periodicity,
//       startdate,
//       amount,
//       remittent,
//       destinatary,
//       project,
//       paymentmethod,
//       lastpaydate,
//     } = sub;
//     const newTransaction: ValidTransactionsReferencesDto = {
//       description: `Subscription transaction for ${susbscriptionplanid}`,
//       amount: amount,
//       date: now,
//       status: 'completed',
//       remittentUser: remittent,
//       destinataryUser: destinatary,
//       project,
//       paymenMethod: paymentmethod,
//     };
//     if (!lastpaydate) {
//       await this.transactionService.create(newTransaction);
//       sub.lastpaydate = now;
//       await this.subscriptionRepository.save(sub);
//       return;
//     }
//     let soonTransactionDate = lastpaydate;

//     switch (periodicity) {
//       case 'daily':
//         soonTransactionDate.setDate(soonTransactionDate.getDate() + 1);
//         break;
//       case 'weekly':
//         soonTransactionDate.setDate(soonTransactionDate.getDate() + 7);
//         break;
//       case 'monthly':
//         soonTransactionDate.setMonth(soonTransactionDate.getMonth() + 1);
//         break;
//       case 'yearly':
//         soonTransactionDate.setFullYear(
//           soonTransactionDate.getFullYear() + 1,
//         );
//         break;
//     }
//     //valida que la fecha de "lastpaydate" + un "rango" dependiendo de periodicy sea menor o igual a la de hoy
//     if (now >= soonTransactionDate) {
//       //tener en cuenta que no validamos si hay dinero o no, ya que solo registramos, no validamos
//       this.transactionService.create(newTransaction);

//       // Actualizar la última fecha de pago en la suscripción
//       sub.lastpaydate = now;
//       await this.subscriptionRepository.save(sub);
//     }
//   }
// }
