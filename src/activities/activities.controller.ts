import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  Get,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  Delete,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivitiesService } from './activities.service';
import {
  AddFeedbackDto,
  CreateActivityDto,
  UpdateActivityDto,
  UpdateStatusDto,
} from './dto/create-activity.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadApiResponse } from 'cloudinary';
import type { MulterFile } from 'src/cloudinary/cloudinary.service';
import { UserRole } from 'src/users/user-role.enum';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    username: string;
    role: UserRole;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() dto: CreateActivityDto,
    @Request() req: RequestWithUser,
    @UploadedFile() file?: MulterFile,
  ) {
    if (file) {
      const result = (await this.cloudinaryService
        .uploadImage(file)
        .catch(() => {
          throw new BadRequestException('Gagal upload gambar');
        })) as UploadApiResponse;
      dto.imageUrl = result.secure_url;
    }
    return this.activitiesService.create(dto, req.user);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @Request() req: RequestWithUser,
    @UploadedFile() file?: MulterFile,
  ) {
    if (file) {
      const result = (await this.cloudinaryService
        .uploadImage(file)
        .catch(() => {
          throw new BadRequestException('Gagal upload gambar');
        })) as UploadApiResponse;
      dto.imageUrl = result.secure_url;
    }
    return this.activitiesService.update(id, dto, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.updateStatus(id, dto.status, req.user);
  }

  @Post(':id/feedback')
  addFeedback(
    @Param('id') id: string,
    @Body() dto: AddFeedbackDto,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.addFeedback(id, dto, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.activitiesService.delete(id, req.user);
  }

  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.activitiesService.findAll(req.user, projectId);
  }
}
