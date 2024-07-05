import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodService } from './payment-method.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/paymentMethod.entity';
import { of } from 'rxjs';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let repository: Repository<PaymentMethod>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodService,
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentMethodService>(PaymentMethodService);
    repository = module.get<Repository<PaymentMethod>>(
      getRepositoryToken(PaymentMethod),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByName', () => {
    it('should return a payment method when found', () => {
      const paymentMethodName = 'Credit Card';
      const paymentMethod = new PaymentMethod();
      paymentMethod.paymentmethodid = 1;
      paymentMethod.name = paymentMethodName;
      paymentMethod.transactions = [];
      paymentMethod.subscriptionPlans = [];

      jest
        .spyOn(repository, 'findOne')
        .mockReturnValueOnce(Promise.resolve(paymentMethod));

      service.findOneByName(paymentMethodName).subscribe((result) => {
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(PaymentMethod);
        expect(result).toEqual(paymentMethod);
        expect(repository.findOne).toHaveBeenCalledWith({
          where: { name: paymentMethodName },
        });
      });
    });
  });
});
