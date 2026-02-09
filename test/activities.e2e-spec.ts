import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ActivityStatus } from './../src/activities/activity-status.enum';

interface LoginResponse {
  access_token: string;
}

interface CreateResponse {
  id: string;
}

interface ActivityResponse {
  id: string;
  name: string;
  description: string;
  issue: string;
  status: ActivityStatus;
  project: {
    id: string;
  };
}

interface FeedbackResponse {
  message: string;
}

describe('Activities Module (e2e)', () => {
  let app: INestApplication;
  let managerToken: string;
  let clientId: string;
  let projectId: string;
  let activityId: string;

  const uniqueId = Date.now();

  const managerUser = {
    username: `pm_act_${uniqueId}`,
    password: 'password123',
    role: 'PROJECT_MANAGER',
  };

  const clientUser = {
    username: `client_act_${uniqueId}`,
    password: 'password123',
    role: 'CLIENT',
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

    const loginBody = loginManager.body as LoginResponse;
    managerToken = loginBody.access_token;

    const resClient = await request(app.getHttpServer())
      .post('/auth/register')
      .send(clientUser);

    const clientBody = resClient.body as CreateResponse;
    clientId = clientBody.id;

    const resProject = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Project for Activity Test',
        startDate: '2026-05-01',
        clientId: clientId,
        estimateValue: 30,
        estimateUnit: 'DAYS',
      });

    const projectBody = resProject.body as CreateResponse;
    projectId = projectBody.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/activities (POST)', () => {
    it('should create a new activity successfully', () => {
      return request(app.getHttpServer())
        .post('/activities')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          projectId: projectId,
          name: 'Database Design',
          description: 'Designing ERD for the new system',
          issue: 'None',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as ActivityResponse;
          expect(body.id).toBeDefined();
          expect(body.name).toEqual('Database Design');
          activityId = body.id;
        });
    });

    it('should fail if projectId is missing', () => {
      return request(app.getHttpServer())
        .post('/activities')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Orphan Activity',
        })
        .expect(400);
    });
  });

  describe('/activities (GET)', () => {
    it('should return list of activities', () => {
      return request(app.getHttpServer())
        .get('/activities')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ActivityResponse[];
          expect(Array.isArray(body)).toBe(true);
          const found = body.find((act) => act.id === activityId);
          expect(found).toBeDefined();
          if (found) {
            expect(found.name).toEqual('Database Design');
          }
        });
    });

    it('should filter activities by projectId', () => {
      return request(app.getHttpServer())
        .get(`/activities?projectId=${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ActivityResponse[];
          const allMatch = body.every((act) => act.project.id === projectId);
          expect(allMatch).toBe(true);
        });
    });
  });

  describe('/activities/:id (GET)', () => {
    it('should return activity details by ID', () => {
      return request(app.getHttpServer())
        .get(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ActivityResponse;
          expect(body.id).toEqual(activityId);
          expect(body.name).toEqual('Database Design');
        });
    });

    it('should return 404 for non-existent activity', () => {
      return request(app.getHttpServer())
        .get(`/activities/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });

  describe('/activities/:id (PATCH) - Update Info', () => {
    it('should update activity details', () => {
      return request(app.getHttpServer())
        .patch(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Database Implementation',
          description: 'Implementing migration files',
          issue: 'Connection timeout',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ActivityResponse;
          expect(body.name).toEqual('Database Implementation');
          expect(body.description).toEqual('Implementing migration files');
          expect(body.issue).toEqual('Connection timeout');
        });
    });
  });

  describe('/activities/:id/status (PATCH) - Update Status', () => {
    it('should update activity status to IN_PROGRESS', () => {
      return request(app.getHttpServer())
        .patch(`/activities/${activityId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: ActivityStatus.IN_PROGRESS,
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ActivityResponse;
          expect(body.status).toEqual(ActivityStatus.IN_PROGRESS);
        });
    });
  });

  describe('/activities/:id/feedback (POST)', () => {
    it('should add feedback successfully', () => {
      return request(app.getHttpServer())
        .post(`/activities/${activityId}/feedback`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          message:
            'tolong slicing page article dengan benar, karena berpengaruh ke SEO',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as FeedbackResponse;
          expect(body.message).toEqual('Feedback added successfully');
        });
    });

    it('should fail if message is empty (Validation)', () => {
      return request(app.getHttpServer())
        .post(`/activities/${activityId}/feedback`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          message: '',
        })
        .expect(400);
    });
  });

  describe('/activities/:id (DELETE)', () => {
    it('should delete the activity', () => {
      return request(app.getHttpServer())
        .delete(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('should return 404 when getting deleted activity', () => {
      return request(app.getHttpServer())
        .get(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});
