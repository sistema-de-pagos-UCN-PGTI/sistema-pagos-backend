import { Roles } from "../../roles/models/role.entity";


export interface User {
    userid?: number;
    email?: string;
    rut?: string;
    firstname?: string;
    lastname?: string;
    hashedpassword?: string;
    role?: Roles[];
}