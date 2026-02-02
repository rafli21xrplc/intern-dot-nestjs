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

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'int', default: 0 })
  progress: number;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
