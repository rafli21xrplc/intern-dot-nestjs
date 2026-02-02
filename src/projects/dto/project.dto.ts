import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
} from 'class-validator';

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
  @IsInt()
  clientId: number;
}

export class AddEngineerDto {
  @IsNotEmpty()
  @IsInt()
  engineerId: number;
}
