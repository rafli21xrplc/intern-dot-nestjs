import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivityEntity } from './activity.entity';
import { ActivityLogEntity } from './activity-log.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ProjectEntity } from 'src/projects/project.entity/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityEntity,
      ActivityLogEntity,
      ProjectEntity,
    ]),
    CloudinaryModule,
  ],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
