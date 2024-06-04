import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSubscriptionDto } from './create-subscription.dto';

export class UpdateSubscriptionDto extends OmitType(
  PartialType(CreateSubscriptionDto),
  ['remittentEmail'] as const,
) {}
