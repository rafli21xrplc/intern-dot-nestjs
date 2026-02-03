import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ActivityEntity } from './activity.entity';
import { UserEntity } from '../users/user.entity/user.entity';

@Entity('activity_logs')
export class ActivityLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @ManyToOne(() => ActivityEntity, (activity) => activity.logs, {
    onDelete: 'CASCADE',
  })
  activity: ActivityEntity;

  @ManyToOne(() => UserEntity)
  performedBy: UserEntity;

  @CreateDateColumn()
  timestamp: Date;
}
