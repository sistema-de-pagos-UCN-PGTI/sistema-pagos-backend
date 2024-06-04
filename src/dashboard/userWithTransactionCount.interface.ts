import { Users } from "src/user/models/user.entity";

export interface UserWithTransactionCount {
    user: Users;
    total: number;
}