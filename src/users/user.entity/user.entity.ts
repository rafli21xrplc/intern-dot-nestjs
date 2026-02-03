import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../user-role.enum';
import { EngineerSpecialization } from '../engineer-specialization.enum';
import { ProjectEntity } from 'src/projects/project.entity/project.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ENGINEER })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: EngineerSpecialization,
    nullable: true,
  })
  specialization: EngineerSpecialization;

  @OneToMany(() => ProjectEntity, (project) => project.manager)
  managedProjects: ProjectEntity[];

  @OneToMany(() => ProjectEntity, (project) => project.client)
  ownedProjects: ProjectEntity[];

  @ManyToMany(() => ProjectEntity, (project) => project.engineers)
  workingProjects: ProjectEntity[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
