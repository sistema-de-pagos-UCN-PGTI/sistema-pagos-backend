import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsValidPeriodicityConstraint
  implements ValidatorConstraintInterface
{
  validate(periodicity: any, args: ValidationArguments) {
    const validPeriodicities = [
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'semiannual',
      'yearly',
    ];
    return (
      typeof periodicity === 'string' &&
      validPeriodicities.includes(periodicity)
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'Periodicity must be one of the following: daily, weekly, monthly, quarterly, semiannual, yearly';
  }
}

export function IsValidPeriodicity(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPeriodicityConstraint,
    });
  };
}
