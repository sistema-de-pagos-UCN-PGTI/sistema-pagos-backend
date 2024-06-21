import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Observable, from } from 'rxjs';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepositoryMock: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepositoryMock = module.get(getRepositoryToken(Project));
  });

  describe('findOneByName', () => {
    it('should return a project when found', () => {
      const projectName = 'Test Project';
      const expectedProject: Project = { projectid: 1, name: projectName, transactions: [], subscriptionPlans: []};

      projectRepositoryMock.findOne.mockReturnValueOnce(from([expectedProject]));

      const result = service.finOneByName(projectName);

      expect(result).toBeInstanceOf(Observable);
      expect(projectRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { name: projectName },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', () => {
      const expectedProjects: Project[] = [
        { projectid: 1, name: 'Test Project 1', transactions: [], subscriptionPlans: []},
        { projectid: 2, name: 'Test Project 2', transactions: [], subscriptionPlans: []},
      ];

      projectRepositoryMock.find.mockReturnValueOnce(from([expectedProjects]));

      const result = service.findAll();

      expect(result).toBeInstanceOf(Observable);
      expect(projectRepositoryMock.find).toHaveBeenCalled();
    });
  });
});