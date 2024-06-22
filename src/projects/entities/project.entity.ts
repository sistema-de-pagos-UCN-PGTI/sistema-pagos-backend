import { SubscriptionPlan } from '../../subscription/entities/subcriptionPlans.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  projectid: number;

  @Column({ type: 'varchar', length: 32, nullable: false })
  name: string;

  @OneToMany(() => Transaction, (transaction) => transaction.project)
  transactions: Transaction[];

  @OneToMany(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.project,
  )
  subscriptionPlans: SubscriptionPlan[];
}
