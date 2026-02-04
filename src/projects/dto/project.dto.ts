import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { EstimateUnit } from '../estimate-unit.enum';
import { ProjectStatus } from '../project-status.enum';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsNumber()
  estimateValue?: number;

  @IsOptional()
  @IsEnum(EstimateUnit)
  estimateUnit?: EstimateUnit;
}

export class AddEngineerDto {
  @IsNotEmpty()
  @IsUUID()
  engineerId: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsNumber()
  estimateValue?: number;

  @IsOptional()
  @IsEnum(EstimateUnit)
  estimateUnit?: EstimateUnit;
}
