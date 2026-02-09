import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

interface LoginResponse {
  access_token: string;
}

interface UserResponse {
  id: string;
  username: string;
  role: string;
  password?: string;
}

describe('Users Module (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const uniqueId = Date.now();
  const mockUser = {
    username: `user_test_${uniqueId}`,
    password: 'password123',
    role: 'PROJECT_MANAGER',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    await request(app.getHttpServer()).post('/auth/register').send(mockUser);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: mockUser.username,
        password: mockUser.password,
      });

    const loginBody = loginRes.body as LoginResponse;
    accessToken = loginBody.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return 401 Unauthorized if no token provided', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should return list of users with 200 OK', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const users = res.body as UserResponse[];

          expect(Array.isArray(users)).toBe(true);
          expect(users.length).toBeGreaterThan(0);

          const firstUser = users[0];

          expect(firstUser.id).toBeDefined();
          expect(firstUser.username).toBeDefined();
          expect(firstUser.role).toBeDefined();

          expect(firstUser.password).toBeUndefined();
        });
    });
  });
});
