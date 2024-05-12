import { Injectable } from '@nestjs/common';
import { Roles } from './models/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, from } from 'rxjs';

@Injectable()
export class RolesService {

    constructor(
        @InjectRepository(Roles)
        private readonly rolesRepository: Repository<Roles>
    ) { }

   create(role: Roles): Observable<Roles> {
        return from(this.rolesRepository.save(role));
   }

    findOne(roleid: number): Observable<Roles> {
          return from(this.rolesRepository.findOne({where: {roleid}}));
    }

}
