import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

interface RegisterResponse {
  id: string;
  username: string;
  role: string;
}

interface LoginResponse {
  access_token: string;
}

describe('Auth Module (e2e)', () => {
  let app: INestApplication;

  const uniqueId = Date.now();
  const mockUser = {
    username: `test_user_${uniqueId}`,
    password: 'password123',
    role: 'ENGINEER',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(mockUser)
        .expect(201)
        .expect((res) => {
          const body = res.body as RegisterResponse;

          expect(body.id).toBeDefined();
          expect(body.username).toEqual(mockUser.username);
        });
    });

    it('should fail if username already exists', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockUser)
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully and return JWT token', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: mockUser.username,
          password: mockUser.password,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as LoginResponse;

          expect(body.access_token).toBeDefined();
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: mockUser.username,
          password: 'wrong_password',
        })
        .expect(401);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'ghost_user_12345',
          password: 'password123',
        })
        .expect(401);
    });
  });
});
