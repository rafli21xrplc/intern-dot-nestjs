import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from '../projects/project.entity/project.entity';
import { UserEntity } from '../users/user.entity/user.entity';
import { ActivityLogEntity } from './activity-log.entity';
import { ActivityStatus } from './activity-status.enum';

@Entity('activities')
export class ActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  issue: string;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.PLANNING,
  })
  status: ActivityStatus;

  @ManyToOne(() => ProjectEntity, (project) => project.activities, {
    onDelete: 'CASCADE',
  })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  assignee: UserEntity;

  @OneToMany(() => ActivityLogEntity, (log) => log.activity)
  logs: ActivityLogEntity[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
