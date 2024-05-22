import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionPlan } from './suscriptionPlans.entity';

@Entity('Project')
export class Project {
  @PrimaryGeneratedColumn()
  projectid: number;
  @Column({ type: 'varchar', length: 32, nullable: false })
  name: string;
  @OneToMany(() => Transaction, (transaction) => transaction.projectid)
  transactions: Transaction[];
  @OneToMany(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.projectid,
  )
  subscriptionPlans: SubscriptionPlan[];
}
