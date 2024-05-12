import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, ManyToMany, JoinTable } from 'typeorm';
import { Roles } from '../../roles/models/role.entity';

@Entity()
export class Users {
    
    @PrimaryGeneratedColumn()
    userid: number;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    rut: string;

    @Column()
    firstname: string;

    @Column()
    lastname: string;

    @Column()
    hashedpassword: string;

    @ManyToMany(() => Roles)
    @JoinTable({
        name: 'users_role',
        joinColumn: { name: 'userid', referencedColumnName: 'userid' }, 
        inverseJoinColumn: { name: 'rolid', referencedColumnName: 'roleid' } 
    })
    role: Roles[];

    @BeforeInsert()
    emailToLowerCase() {
        this.email = this.email.toLowerCase();
    }
}