import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionPlan } from './suscriptionPlans.entity';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn({ type: 'integer' })
  paymentmethodid: number;
  @Column({ type: 'varchar', length: 16, nullable: false })
  name: string;
  @OneToMany(
    () => SubscriptionPlan,
    (subscriptionPlan) => subscriptionPlan.paymentmethodid,
  )
  paymentMehtods: SubscriptionPlan[];
}
