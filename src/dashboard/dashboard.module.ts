import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]),
  UserModule,
  SubscriptionModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
