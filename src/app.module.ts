import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from './roles/roles.module';
import { TransactionsModule } from './transactions/transactions.module';
import { Users } from './user/models/user.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { Project } from './projects/entities/project.entity';
import { PaymentMethod } from './payment-method/entities/paymentMethod.entity';
import { ProjectsModule } from './projects/projects.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SubscriptionPlan } from './subscription/entities/subcriptionPlans.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: false,
      autoLoadEntities: true,
      useUTC: true,
      entities: [Users, Transaction, Project, PaymentMethod, SubscriptionPlan],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    RolesModule,
    TransactionsModule,
    ProjectsModule,
    PaymentMethodModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
