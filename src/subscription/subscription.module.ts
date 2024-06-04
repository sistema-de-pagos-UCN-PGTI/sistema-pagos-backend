import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UserModule } from 'src/user/user.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { PaymentMethodModule } from 'src/payment-method/payment-method.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from './entities/subcriptionPlans.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan]),
    TransactionsModule,
    UserModule,
    ProjectsModule,
    PaymentMethodModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
//TODO -> reparar problema sobre las validaciones de los dto(repeticióin de código)
//Todo -> Hay problemas con token user, aveces es solo request.user.user pero otras es solo request.user
//Todo --> repetición de código en eliminar contraseña
