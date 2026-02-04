import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
  ) {}
  async create(userData: unknown): Promise<UserEntity> {
    const user = this.repo.create(userData as UserEntity);
    try {
      return await this.repo.save(user);
    } catch (error: unknown) {
      if ((error as any) === '23505') {
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

  async findById(id: string): Promise<UserEntity | undefined> {
    const user = await this.repo.findOneBy({ id });
    return user || undefined;
  }
}
