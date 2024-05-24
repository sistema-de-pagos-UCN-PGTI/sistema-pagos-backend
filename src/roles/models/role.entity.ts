import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Roles {
  @PrimaryGeneratedColumn()
  roleid: number;

  @Column({ unique: true, nullable: false })
  name: string;
}
