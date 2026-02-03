import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService, UserRequestData } from './projects.service';
import { CreateProjectDto, AddEngineerDto } from './dto/project.dto';

interface RequestWithUser extends Request {
  user: UserRequestData;
}

@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() body: CreateProjectDto, @Request() req: RequestWithUser) {
    return this.projectsService.create(body, req.user);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.projectsService.findAll(req.user);
  }

  @Post(':id/engineers')
  addEngineer(
    @Param('id') id: string,
    @Body() body: AddEngineerDto,
    @Request() req: RequestWithUser,
  ) {
    return this.projectsService.addEngineer(id, body.engineerId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.projectsService.findOne(id, req.user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.projectsService.delete(id, req.user);
  }
}
