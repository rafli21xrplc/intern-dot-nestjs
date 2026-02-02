import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity/project.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/project.dto';

export interface UserRequestData {
  userId: number;
  username: string;
  role: UserRole;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private projectRepo: Repository<ProjectEntity>,
    private usersService: UsersService,
  ) {}

  async create(data: CreateProjectDto, user: UserRequestData) {
    if (user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('Only Project Manager can create projects');
    }

    const client = await this.usersService.findById(data.clientId);
    if (!client) throw new NotFoundException('Client not found');

    const manager = await this.usersService.findById(user.userId);
    if (!manager) throw new NotFoundException('Manager info not found');

    const newProject = this.projectRepo.create({
      name: data.name,
      startDate: new Date(data.startDate),
      description: data.description,
      manager: manager,
      client: client,
    });

    return this.projectRepo.save(newProject);
  }

  async findAll(user: UserRequestData) {
    const query = this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.manager', 'manager')
      .leftJoinAndSelect('project.client', 'client')
      .leftJoinAndSelect('project.engineers', 'engineers');

    if (user.role === UserRole.PROJECT_MANAGER) {
      query.where('manager.id = :id', { id: user.userId });
    } else if (user.role === UserRole.ENGINEER) {
      query.where('engineers.id = :id', { id: user.userId });
    } else if (user.role === UserRole.CLIENT) {
      query.where('client.id = :id', { id: user.userId });
    }

    return query.getMany();
  }

  async addEngineer(
    projectId: number,
    engineerId: number,
    user: UserRequestData,
  ) {
    if (user.role !== UserRole.PROJECT_MANAGER) throw new ForbiddenException();

    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['engineers', 'manager'],
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.manager.id !== user.userId)
      throw new ForbiddenException('Not your project');

    const engineer = await this.usersService.findById(engineerId);
    if (!engineer) throw new NotFoundException('Engineer not found');

    const isExist = project.engineers.some((e) => e.id === engineerId);
    if (!isExist) {
      project.engineers.push(engineer);
      return this.projectRepo.save(project);
    }
    return project;
  }
}
