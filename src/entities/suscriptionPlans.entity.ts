import { Users } from 'src/user/models/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { PaymentMethod } from '../payment-method/entities/paymentMethod.entity';
import { User } from 'src/user/models/user.interface';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  susbscriptionplanid: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer', nullable: false })
  amount: number;

  @Column({ nullable: false, type: 'timestamp with time zone' })
  startdate: Date;

  @ManyToOne(() => Users, (user) => user.remitedSubscription)
  @JoinColumn({ name: 'remittentid' })
  remittent: User;

  @ManyToOne(() => Users, (user) => user.receivedSubscription)
  @JoinColumn({ name: 'destinataryid' })
  destinatary: User;

  @ManyToOne(() => Project, (project) => project.subscriptionPlans)
  @JoinColumn({ name: 'projetid' })
  project: Project;

  @Column({ type: 'bool', nullable: false, default: false })
  status: boolean;

  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.subscriptionPlans,
  )
  @JoinColumn({ name: 'paymentmethodid' })
  paymentmethod: PaymentMethod;

  @Column({ type: 'varchar', length: 24 })
  periodicity: string;
}
