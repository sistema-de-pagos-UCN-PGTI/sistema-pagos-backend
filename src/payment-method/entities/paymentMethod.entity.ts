import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Transaction } from 'src/transactions/entities/transaction.entity';
import { SubscriptionPlan } from 'src/subscription/entities/subcriptionPlans.entity';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn({ type: 'integer' })
  paymentmethodid: number;
  @Column({ type: 'varchar', length: 16, nullable: false })
  name: string;
  @OneToMany(() => Transaction, (transaction) => transaction.paymentMethod)
  transactions: Transaction[];
  @OneToMany(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.paymentmethod,
  )
  subscriptionPlans: SubscriptionPlan[];
}
