import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity/user.entity';

// Definisikan tipe minimal untuk error database
interface DatabaseError {
  code?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
  ) {}

  async create(userData: unknown): Promise<UserEntity> {
    const user = this.repo.create(userData as UserEntity);
    try {
      const savedUser = await this.repo.save(user);
      return savedUser;
    } catch (error: unknown) {
      const dbError = error as DatabaseError;

      if (dbError.code === '23505') {
        throw new ConflictException('Username already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll() {
    return this.repo.find({
      select: ['id', 'username', 'role', 'specialization', 'createdAt'],
      order: { username: 'ASC' },
    });
  }

  async findOne(username: string): Promise<UserEntity | undefined> {
    const user = await this.repo
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .addSelect('user.password')
      .getOne();

    return user || undefined;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }
}
