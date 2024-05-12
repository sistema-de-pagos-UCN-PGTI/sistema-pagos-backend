import { Controller, Post } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {

    constructor(private rolesService: RolesService) { }

}
