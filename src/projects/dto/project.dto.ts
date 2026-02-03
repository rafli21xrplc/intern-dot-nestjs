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
