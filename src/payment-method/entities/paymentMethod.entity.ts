import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Transaction } from '../../transactions/entities/transaction.entity';
import { SubscriptionPlan } from '../../subscription/entities/subcriptionPlans.entity';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn({ type: 'integer' })
  paymentmethodid: number;
  @Column({ type: 'varchar', length: 30, nullable: false })
  name: string;
  @OneToMany(() => Transaction, (transaction) => transaction.paymentMethod)
  transactions: Transaction[];
  @OneToMany(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.paymentmethod,
  )
  subscriptionPlans: SubscriptionPlan[];
}
