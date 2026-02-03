import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/user.entity/user.entity';
import { ProjectStatus } from '../project-status.enum';
import { EstimateUnit } from '../estimate-unit.enum';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'date' }) startDate: Date;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @ManyToOne(() => UserEntity, (user) => user.managedProjects)
  manager: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.ownedProjects)
  client: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.workingProjects)
  @JoinTable({ name: 'project_engineers' })
  engineers: UserEntity[];

  @Column({ type: 'float', nullable: true })
  estimateValue: number;

  @Column({
    type: 'enum',
    enum: EstimateUnit,
    default: EstimateUnit.DAYS,
  })
  estimateUnit: EstimateUnit;

  @Column({ type: 'int', default: 0 }) progress: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
