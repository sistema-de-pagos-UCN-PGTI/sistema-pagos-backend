import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToMany,
  JoinTable,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Roles } from '../../roles/models/role.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { SubscriptionPlan } from 'src/entities/suscriptionPlans.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  userid: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  rut: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column()
  hashedpassword: string;

  @ManyToMany(() => Roles)
  @JoinTable({
    name: 'users_role',
    joinColumn: { name: 'userid', referencedColumnName: 'userid' },
    inverseJoinColumn: { name: 'rolid', referencedColumnName: 'roleid' },
  })
  role: Roles[];
  @OneToMany(() => Transaction, (transaction) => transaction.remittentdid)
  remitedTransactions: Transaction[];
  @OneToMany(() => Transaction, (transaction) => transaction.destinataryid)
  receivedTransactions: Transaction[];
  @ManyToOne(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.remittentid,
  )
  remitedSubscription: SubscriptionPlan[];
  @ManyToOne(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.destinataryid,
  )
  receivedSubscription: SubscriptionPlan[];
  @BeforeInsert()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }
}
