import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from './models/role.entity';
import { of } from 'rxjs';

describe('RolesService', () => {
  let service: RolesService;
  let rolesRepository: Repository<Roles>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Roles),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    rolesRepository = module.get<Repository<Roles>>(getRepositoryToken(Roles));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should save a new role', async () => {
      const role: Roles = { roleid: 1, name: 'user'};
      jest.spyOn(rolesRepository, 'save').mockReturnValueOnce(Promise.resolve(role));

      service.create(role).subscribe((result) => {
        expect(result).toEqual(role);
      });
      
    });
  });

  describe('findOne', () => {
    it('should find a role by roleid', async () => {
      const roleid = 1;
      const role: Roles = { roleid: 1, name: 'user'};
      jest.spyOn(rolesRepository, 'findOne').mockReturnValueOnce(Promise.resolve(role));

      service.findOne(roleid).subscribe((result) => {
        expect(result).toEqual(role);
      });

      expect(rolesRepository.findOne).toHaveBeenCalledWith({where: {roleid}});
      

    });
  });
});