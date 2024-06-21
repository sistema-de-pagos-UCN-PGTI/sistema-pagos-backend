import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
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

  findAll() {
    return from(this.projectRepository.find());
  }

}
