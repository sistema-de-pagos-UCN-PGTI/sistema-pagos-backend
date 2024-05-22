import { PaymentMethod } from 'src/entities/paymentMethod.entity';
import { Project } from 'src/entities/project.entity';
import { Users } from 'src/user/models/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  transactionid: number;
  @Column('longtext')
  description: string;
  @Column({ type: 'integer', nullable: false })
  amount: number;
  @Column({ nullable: false, type: 'timestamp with time zone' })
  date: Date;
  @Column({ type: 'varchar', length: 32, nullable: false })
  status: string;
  @ManyToOne(() => Users, (user) => user.remitedTransactions)
  remittentdid: number;
  @ManyToOne(() => Users, (user) => user.remitedTransactions)
  destinataryid: number;
  @ManyToOne(() => Project, (project) => project.projectid)
  projectid: number;
  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.paymentmethodid,
  )
  paymetmethodid: number;
}
