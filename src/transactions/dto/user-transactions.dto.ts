import { Transaction } from '../entities/transaction.entity';

export class UserTransactions {
  receivedTransactions: Transaction[];
  emittedTransactions: Transaction[];
}
