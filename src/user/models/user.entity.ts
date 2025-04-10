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
import { Transaction } from '../../transactions/entities/transaction.entity';
import { SubscriptionPlan } from '../../subscription/entities/subcriptionPlans.entity';
import { Project } from '../../projects/entities/project.entity';

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

  @OneToMany(() => Transaction, (transaction) => transaction.remittent)
  remitedTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.destinatary)
  receivedTransactions: Transaction[];

  @OneToMany(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.remittent,
  )
  remitedSubscription: SubscriptionPlan[];

  @OneToMany(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.destinatary,
  )
  receivedSubscription: SubscriptionPlan[];

  @ManyToMany(() => Project)
  @JoinTable({
    name: 'users_projects',
    joinColumn: { name: 'userid', referencedColumnName: 'userid' },
    inverseJoinColumn: { name: 'projectid', referencedColumnName: 'projectid' },
  })
  projects?: Project[];

  @BeforeInsert()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }
}
