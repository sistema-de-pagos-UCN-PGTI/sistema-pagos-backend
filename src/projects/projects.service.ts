import { Inject, Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Repository } from 'typeorm';
import { Project } from 'src/projects/entities/project.entity';
import { Observable, from } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  finOneByName(projectName: string): Observable<Project> {
    return from(
      this.projectRepository.findOne({
        where: {
          name: projectName,
        },
      }),
    );
  }
  create(createProjectDto: CreateProjectDto) {
    return 'This action adds a new project';
  }

  findAll() {
    return from(this.projectRepository.find());
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }
  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }
}
