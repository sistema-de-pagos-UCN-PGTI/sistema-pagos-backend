import { PaymentMethod } from 'src/payment-method/entities/paymentMethod.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Users } from 'src/user/models/user.entity';
import { User } from 'src/user/models/user.interface';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  transactionid: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer', nullable: false })
  amount: number;

  @Column({ nullable: false, type: 'timestamp with time zone' })
  date: Date;

  @Column({ type: 'varchar', length: 32, nullable: false })
  status: string;

  @ManyToOne(() => Users, (user) => user.remitedTransactions)
  @JoinColumn({ name: 'remittentid' })
  remittent: User;

  @ManyToOne(() => Users, (user) => user.receivedTransactions)
  @JoinColumn({ name: 'destinataryid' })
  destinatary: User;

  @ManyToOne(() => Project, (project) => project.transactions)
  @JoinColumn({ name: 'projectid' })
  project: Project;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.transactions)
  @JoinColumn({ name: 'paymentmethodid' })
  paymentMethod: PaymentMethod;
}
