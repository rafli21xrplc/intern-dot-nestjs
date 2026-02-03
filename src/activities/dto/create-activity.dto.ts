import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateActivityDto {
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  issue?: string;
}

export class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class UpdateActivityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  issue?: string;
}

export class AddFeedbackDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
