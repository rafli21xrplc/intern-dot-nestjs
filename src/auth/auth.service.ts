import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    return this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOne(loginDto.username);
    if (user && (await bcrypt.compare(loginDto.password, user.password))) {
      const payload = {
        username: user.username,
        sub: user.id,
        role: user.role,
      };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          specialization: user.specialization,
        },
      };
    }
    throw new UnauthorizedException('Username atau Password salah');
  }
}
