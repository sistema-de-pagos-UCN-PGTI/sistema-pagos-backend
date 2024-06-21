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
  firstValueFrom,
  from,
  map,
  mergeMap,
  switchMap,
  throwError,
} from 'rxjs';
import { ValidSubscriptionReferencesDto } from './dto/valid-references.dto';
import { User } from 'src/user/models/user.interface';
import { UserService } from 'src/user/user.service';
const pLimit = require('p-limit');

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
    try {
      const limit = pLimit(3);
      await firstValueFrom(this.handleSubscriptionTransactions(limit));
      console.log('Cron job completed successfully.');
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  }

  private handleSubscriptionTransactions(limit): Observable<void> {
    console.log('Automatic subscription transactions processing.');
    return from(
      this.subscriptionRepository.find({
        where: { status: 'vigente' },
        relations: ['remittent', 'destinatary', 'project', 'paymentmethod'],
      }),
    ).pipe(
      switchMap((activeSubscriptions) => {
        if (activeSubscriptions.length === 0) {
          console.log('No active subscriptions found.');
          return from([]);
        }

        const now = new Date();

        const subscriptionPromises = activeSubscriptions.map((sub) =>
          limit(() => this.processSubscription(sub, now)),
        );

        return from(Promise.all(subscriptionPromises)).pipe(
          map(() => {
            console.log('Finalizando manejo de suscripciones.');
            return undefined;
          }),
          catchError((err) => {
            console.error('Error in handleSubscriptionTransactions:', err);
            return from([]);
          }),
        );
      }),
      catchError((err) => {
        console.error('Error in finding subscriptions:', err);
        return from([]);
      }),
    );
  }

  private async processSubscription(sub, now): Promise<void> {
    const {
      subscriptionplanid,
      periodicity,
      amount,
      remittent,
      destinatary,
      project,
      paymentmethod,
      lastpaydate,
    } = sub;

    const newTransaction: ValidTransactionsReferencesDto = {
      description: `Subscription transaction for ${sub.description}`,
      amount: amount,
      date: now,
      status: 'completed',
      remittentUser: remittent,
      destinataryUser: destinatary,
      project,
      paymenMethod: paymentmethod,
    };

    if (!lastpaydate) {
      console.log('First payment for subscription:', subscriptionplanid);
      return firstValueFrom(this.transactionService.create(newTransaction))
        .then(() => {
          sub.lastpaydate = now;
          return this.subscriptionRepository.save(sub);
        })
        .then(() => {
          console.log('New transaction created and subscription updated.');
        })
        .catch((err) => {
          console.error('Error in creating new transaction:', err);
        });
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
        soonTransactionDate.setMonth(soonTransactionDate.getMonth() + 1);
        break;
      case 'quarterly':
        soonTransactionDate.setMonth(soonTransactionDate.getMonth() + 4);
        break;
      case 'semiannual':
        soonTransactionDate.setMonth(soonTransactionDate.getMonth() + 6);
        break;
      case 'yearly':
        soonTransactionDate.setFullYear(soonTransactionDate.getFullYear() + 1);
        break;
    }

    if (now >= soonTransactionDate) {
      console.log('Creating transaction for subscription:', subscriptionplanid);
      return firstValueFrom(this.transactionService.create(newTransaction))
        .then(() => {
          sub.lastpaydate = now;
          return this.subscriptionRepository.save(sub);
        })
        .then(() => {
          console.log('Transaction processed and subscription updated.');
        })
        .catch((err) => {
          console.error('Error in processing transaction:', err);
        });
    } else {
      console.log(
        'No transaction needed at this time for subscription:',
        subscriptionplanid,
      );
      return Promise.resolve();
    }
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
      where: [{ remittent: user }],
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

  findSubscriptionsByProject(projectid: number) {
    return from(
      this.subscriptionRepository.find({
        where: { project: { projectid } },
        relations: ['remittent', 'destinatary', 'project', 'paymentmethod'],
      }),
    ).pipe(
      map((subscriptions) => {
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
      }),
    );
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
