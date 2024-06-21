import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodService } from './payment-method.service';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/paymentMethod.entity';
import { Observable, from } from 'rxjs';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let repository: Repository<PaymentMethod>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodService,
        {
          provide: Repository,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentMethodService>(PaymentMethodService);
    repository = module.get<Repository<PaymentMethod>>(Repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByName', () => {
    it('should return a payment method when found', () => {
      const paymentMethodName = 'Credit Card';
      const paymentMethod: PaymentMethod = {
        paymentmethodid: 1,
        name: paymentMethodName,
        transactions: [],
        subscriptionPlans: [],
      };
      jest.spyOn(repository, 'findOne').mockReturnValueOnce(Promise.resolve(paymentMethod));
      
      service.findOneByName(paymentMethodName).subscribe((result) => {
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(PaymentMethod);
        expect(repository.findOne).toHaveBeenCalledWith({ where: { name: paymentMethodName } });
      });
    });
  });
});