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
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from './project-status.enum';

export interface UserRequestData {
  userId: string;
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
      estimateValue: data.estimateValue,
      estimateUnit: data.estimateUnit,
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
    projectId: string,
    engineerId: string,
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

  async findOne(id: string, user: UserRequestData) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: [
        'manager',
        'client',
        'engineers',
        'activities',
        'activities.assignee',
        'activities.logs',
        'activities.logs.performedBy',
      ],
      order: {
        activities: {
          createdAt: 'DESC',
          logs: {
            timestamp: 'DESC',
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let hasAccess = false;

    if (user.role === UserRole.PROJECT_MANAGER) {
      hasAccess = project.manager.id === user.userId;
    } else if (user.role === UserRole.ENGINEER) {
      hasAccess = project.engineers.some((eng) => eng.id === user.userId);
    } else if (user.role === UserRole.CLIENT) {
      hasAccess = project.client.id === user.userId;
    }

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to this project details',
      );
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, user: UserRequestData) {
    if (user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('Only Project Manager can update projects');
    }

    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['manager'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.manager.id !== user.userId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    if (dto.name) project.name = dto.name;
    if (dto.description) project.description = dto.description;
    if (dto.startDate) project.startDate = new Date(dto.startDate);
    if (dto.status) project.status = dto.status;
    if (dto.estimateValue) project.estimateValue = dto.estimateValue;
    if (dto.estimateUnit) project.estimateUnit = dto.estimateUnit;

    if (dto.clientId) {
      const client = await this.usersService.findById(dto.clientId);
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      project.client = client;
    }

    return this.projectRepo.save(project);
  }

  async updateStatus(id: string, status: ProjectStatus, user: UserRequestData) {
    if (user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('Only Project Manager can update projects');
    }

    const project = await this.findOne(id, user);

    project.status = status;

    return this.projectRepo.save(project);
  }

  async delete(id: string, user: UserRequestData) {
    if (user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('Only Project Manager can delete projects');
    }

    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['manager'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.manager.id !== user.userId) {
      throw new ForbiddenException(
        'You cannot delete a project you do not manage',
      );
    }

    return this.projectRepo.delete(id);
  }
}
