import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEntity } from './activity.entity';
import { ActivityLogEntity } from './activity-log.entity';
import {
  AddFeedbackDto,
  CreateActivityDto,
  UpdateActivityDto,
} from './dto/create-activity.dto';
import { ProjectEntity } from '../projects/project.entity/project.entity';
import { UserEntity } from '../users/user.entity/user.entity';
import { UserRole } from 'src/users/user-role.enum';
import { ActivityStatus } from './activity-status.enum';

interface UserRequestData {
  userId: string;
  username: string;
  role: UserRole;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(ActivityEntity)
    private activityRepo: Repository<ActivityEntity>,
    @InjectRepository(ActivityLogEntity)
    private logRepo: Repository<ActivityLogEntity>,
    @InjectRepository(ProjectEntity)
    private projectRepo: Repository<ProjectEntity>,
  ) {}

  async create(dto: CreateActivityDto, user: UserRequestData) {
    if (user.role === UserRole.CLIENT) {
      throw new ForbiddenException('Client cannot create activities');
    }

    const project = await this.projectRepo.findOneBy({ id: dto.projectId });

    if (!project) {
      throw new NotFoundException(`Project with ID ${dto.projectId} not found`);
    }

    const newActivity = this.activityRepo.create({
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      issue: dto.issue,
      project: project,
      assignee: { id: user.userId } as UserEntity,
    });

    const savedActivity = await this.activityRepo.save(newActivity);

    await this.logActivity(
      savedActivity,
      project,
      user.userId,
      'CREATED',
      'Activity created',
    );

    return savedActivity;
  }

  async update(id: string, dto: UpdateActivityDto, user: UserRequestData) {
    if (user.role === UserRole.CLIENT) {
      throw new ForbiddenException('Client cannot update activity details');
    }

    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!activity) throw new NotFoundException('Activity not found');

    if (dto.name) activity.name = dto.name;
    if (dto.description) activity.description = dto.description;
    if (dto.imageUrl) activity.imageUrl = dto.imageUrl;
    if (dto.issue) activity.issue = dto.issue;

    const savedActivity = await this.activityRepo.save(activity);

    await this.logActivity(
      savedActivity,
      activity.project,
      user.userId,
      'UPDATE',
      'Activity details updated',
    );

    return savedActivity;
  }

  async updateStatus(
    id: string,
    status: ActivityStatus,
    user: UserRequestData,
  ) {
    if (user.role === UserRole.CLIENT) {
      throw new ForbiddenException('Client cannot update status');
    }

    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!activity) throw new NotFoundException('Activity not found');

    activity.status = status;
    await this.activityRepo.save(activity);

    await this.logActivity(
      activity,
      activity.project,
      user.userId,
      'STATUS_CHANGE',
      `Status changed ${status}`,
    );

    return activity;
  }

  async addFeedback(id: string, dto: AddFeedbackDto, user: UserRequestData) {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['project', 'project.client'],
    });
    if (!activity) throw new NotFoundException('Activity not found');

    if (
      user.role === UserRole.CLIENT &&
      activity.project.client.id !== user.userId
    ) {
      throw new ForbiddenException(
        'You can only give feedback to your own project',
      );
    }

    await this.logActivity(
      activity,
      activity.project,
      user.userId,
      'FEEDBACK',
      dto.message,
    );

    return { message: 'Feedback added successfully' };
  }

  private async logActivity(
    activity: ActivityEntity | null,
    project: ProjectEntity,
    userId: string,
    action: string,
    details: string,
  ) {
    const log = this.logRepo.create({
      action,
      details,
      activity: activity || undefined,
      project,
      performedBy: { id: userId } as UserEntity,
    });
    return this.logRepo.save(log);
  }

  async delete(id: string, user: UserRequestData) {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['assignee'],
    });

    if (!activity) throw new NotFoundException('Activity not found');

    if (user.role === UserRole.CLIENT) {
      throw new ForbiddenException('Client cannot delete activities');
    }

    if (
      user.role === UserRole.ENGINEER &&
      activity.assignee?.id !== user.userId
    ) {
      throw new ForbiddenException('You can only delete your own activities');
    }

    return this.activityRepo.remove(activity);
  }

  async findAll(user: UserRequestData, projectId?: string) {
    const query = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.assignee', 'assignee')
      .leftJoinAndSelect('activity.project', 'project')
      .leftJoin('project.client', 'client')
      .leftJoin('project.engineers', 'engineers')
      .orderBy('activity.createdAt', 'DESC');

    if (projectId) {
      query.andWhere('project.id = :projectId', { projectId });
    }

    if (user.role === UserRole.CLIENT) {
      query.andWhere('client.id = :userId', { userId: user.userId });
    } else if (user.role === UserRole.ENGINEER) {
      query.andWhere('engineers.id = :userId', { userId: user.userId });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['logs', 'logs.performedBy', 'assignee'],
      order: { logs: { timestamp: 'DESC' } },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }
}
