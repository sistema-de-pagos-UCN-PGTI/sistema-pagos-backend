import { Injectable } from '@nestjs/common';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/paymentMethod.entity';
import { Observable, from } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}
  findOneByName(paymentMethodName: string): Observable<PaymentMethod> {
    return from(
      this.paymentMethodRepository.findOne({
        where: { name: paymentMethodName },
      }),
    );
  }

  findAll(): Observable<PaymentMethod[]> {
    return from(this.paymentMethodRepository.find());
  }
}
