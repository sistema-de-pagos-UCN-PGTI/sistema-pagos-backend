import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionPlan } from '../../entities/suscriptionPlans.entity';

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
