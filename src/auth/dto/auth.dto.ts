import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { EngineerSpecialization } from 'src/users/engineer-specialization.enum';
import { UserRole } from 'src/users/user-role.enum';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role salah. Pilih: PROJECT_MANAGER, ENGINEER, atau CLIENT',
  })
  role?: UserRole;

  @IsOptional()
  @IsEnum(EngineerSpecialization)
  specialization?: EngineerSpecialization;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
