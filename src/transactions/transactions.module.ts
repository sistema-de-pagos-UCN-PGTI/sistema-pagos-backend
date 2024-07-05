import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { PaymentMethodModule } from 'src/payment-method/payment-method.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserService } from 'src/user/user.service';
import { ProjectsService } from 'src/projects/projects.service';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    UserModule,
    ProjectsModule,
    PaymentMethodModule,
    AuthModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
