import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ProjectStatus } from './../src/projects/project-status.enum';

interface LoginResponse {
  access_token: string;
}

interface CreateUserResponse {
  id: string;
}

interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  client: {
    id: string;
  };
}

interface ProjectWithEngineersResponse {
  engineers: {
    id: string;
  }[];
}

describe('Projects Module (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;
  let engineerToken: string;
  let clientId: string;
  let engineerId: string;
  let projectId: string;

  const uniqueId = Date.now();

  const managerUser = {
    username: `pm_test_${uniqueId}`,
    password: 'password123',
    role: 'PROJECT_MANAGER',
  };

  const clientUser = {
    username: `client_test_${uniqueId}`,
    password: 'password123',
    role: 'CLIENT',
  };

  const engineerUser = {
    username: `eng_test_${uniqueId}`,
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

    await request(app.getHttpServer()).post('/auth/register').send(managerUser);
    const loginManager = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: managerUser.username, password: managerUser.password });

    const managerBody = loginManager.body as LoginResponse;
    managerToken = managerBody.access_token;

    const resClient = await request(app.getHttpServer())
      .post('/auth/register')
      .send(clientUser);
    const clientBody = resClient.body as CreateUserResponse;
    clientId = clientBody.id;

    const resEng = await request(app.getHttpServer())
      .post('/auth/register')
      .send(engineerUser);
    const engBody = resEng.body as CreateUserResponse;
    engineerId = engBody.id;

    const loginEng = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: engineerUser.username,
        password: engineerUser.password,
      });
    const engLoginBody = loginEng.body as LoginResponse;
    engineerToken = engLoginBody.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/projects (POST)', () => {
    it('should fail if Engineer tries to create project (403)', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          name: 'Illegal Project',
          startDate: '2026-01-01',
          clientId: clientId,
        })
        .expect(403);
    });

    it('should create project successfully by Manager (201)', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'E2E Test Project',
          description: 'Project created via E2E test',
          startDate: '2026-03-01',
          clientId: clientId,
          estimateValue: 10,
          estimateUnit: 'DAYS',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as ProjectResponse;

          expect(body.id).toBeDefined();
          expect(body.name).toEqual('E2E Test Project');
          expect(body.client.id).toEqual(clientId);

          projectId = body.id;
        });
    });
  });

  describe('/projects (GET)', () => {
    it('should return list of projects', () => {
      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ProjectResponse[];

          expect(Array.isArray(body)).toBe(true);
          const found = body.find((p) => p.id === projectId);
          expect(found).toBeDefined();
        });
    });
  });

  describe('/projects/:id (GET)', () => {
    it('should return project details', () => {
      return request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ProjectResponse;
          expect(body.id).toEqual(projectId);
          expect(body.name).toEqual('E2E Test Project');
        });
    });
  });

  describe('/projects/:id (PATCH)', () => {
    it('should update project details', () => {
      return request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Updated Project Name',
          description: 'Updated Description',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ProjectResponse;
          expect(body.name).toEqual('Updated Project Name');
          expect(body.description).toEqual('Updated Description');
        });
    });
  });

  describe('/projects/:id/status (PATCH)', () => {
    it('should update project status', () => {
      return request(app.getHttpServer())
        .patch(`/projects/${projectId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: ProjectStatus.IN_PROGRESS,
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ProjectResponse;
          expect(body.status).toEqual(ProjectStatus.IN_PROGRESS);
        });
    });
  });

  describe('/projects/:id/engineers (POST)', () => {
    it('should add engineer to project', () => {
      return request(app.getHttpServer())
        .post(`/projects/${projectId}/engineers`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          engineerId: engineerId,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as ProjectWithEngineersResponse;

          const engineers = body.engineers;
          const found = engineers.find((e) => e.id === engineerId);
          expect(found).toBeDefined();
        });
    });
  });

  describe('/projects/:id (DELETE)', () => {
    it('should delete project', () => {
      return request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('should fail to get deleted project (404)', () => {
      return request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});
