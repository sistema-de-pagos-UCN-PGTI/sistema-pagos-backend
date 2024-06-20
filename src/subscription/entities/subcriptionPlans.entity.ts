import { Users } from '../../user/models/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/models/user.interface';
import { Project } from '../../projects/entities/project.entity';
import { PaymentMethod } from '../../payment-method/entities/paymentMethod.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  subscriptionplanid: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer', nullable: false })
  amount: number;

  @Column({ nullable: false, type: 'timestamp with time zone' })
  startdate: Date;

  @Column({ type: 'varchar', length: 24 })
  periodicity: string;

  @Column({ type: 'varchar', length: 24 })
  status: string;

  @Column({ type: 'date', nullable: true })
  lastpaydate: Date;

  @ManyToOne(() => Users, (user) => user.remitedSubscription)
  @JoinColumn({ name: 'remittenttid' })
  remittent: User;

  @ManyToOne(() => Users, (user) => user.receivedSubscription)
  @JoinColumn({ name: 'destinataryid' })
  destinatary: User;

  @ManyToOne(() => Project, (project) => project.subscriptionPlans)
  @JoinColumn({ name: 'projectid' })
  project: Project;

  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.subscriptionPlans,
  )
  @JoinColumn({ name: 'paymentmethodid' })
  paymentmethod: PaymentMethod;
}
