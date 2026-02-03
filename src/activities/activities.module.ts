import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivityEntity } from './activity.entity';
import { ActivityLogEntity } from './activity-log.entity';
import { ProjectsModule } from 'src/projects/projects.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityEntity, ActivityLogEntity]),
    ProjectsModule,
    CloudinaryModule,
  ],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
