import { Users } from 'src/user/models/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { PaymentMethod } from './paymentMethod.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  susbscriptionplanid: number;
  @Column({ type: 'longtext' })
  description: string;
  @Column({ type: 'integer', nullable: false })
  amount: number;
  @Column({ nullable: false, type: 'timestamp with time zone' })
  startdate: Date;
  @OneToMany(() => Users, (user) => user.userid)
  remittentid: number;
  @OneToMany(() => Users, (user) => user.userid)
  destinataryid: number;
  @ManyToOne(() => Project, (project) => project.projectid)
  projectid: number;
  @Column({ type: 'bool', nullable: false, default: false })
  status: boolean;
  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.paymentmethodid,
  )
  paymentmethodid: number;
  @Column({ type: 'varchar', length: 24 })
  periodicity: string;
}
