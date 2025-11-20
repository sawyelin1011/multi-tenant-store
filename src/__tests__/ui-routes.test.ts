import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../config/database.js';
import uiRouter from '../routes/tenant/ui.js';

const app = express();
app.use(express.json());
app.use((req: any, res, next) => {
  req.tenantId = 'test-tenant-id';
  next();
});
app.use('/api/test/admin/ui', uiRouter);

describe('UI Template Routes', () => {
  let testTenantId: string;
  let testThemeId: string;
  let testLayoutId: string;
  let testComponentId: string;

  beforeAll(async () => {
    const tenant = await db.one(
      `INSERT INTO tenants (slug, name)
       VALUES ('test-ui-routes', 'Test UI Routes')
       RETURNING id`
    );
    testTenantId = tenant.id;
  });

  afterAll(async () => {
    await db.none('DELETE FROM tenants WHERE id = $1', [testTenantId]);
  });

  describe('POST /themes', () => {
    it('should create a theme', async () => {
      const response = await request(app)
        .post('/api/test/admin/ui/themes')
        .send({
          name: 'Test Theme',
          slug: 'test-theme',
          is_default: true,
          colors: {
            primary: '#3b82f6',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Theme');
      testThemeId = response.body.data.id;
    });
  });

  describe('GET /themes/current', () => {
    it('should get current theme', async () => {
      const response = await request(app).get('/api/test/admin/ui/themes/current');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /layouts', () => {
    it('should create a layout', async () => {
      const response = await request(app)
        .post('/api/test/admin/ui/layouts')
        .send({
          name: 'Test Layout',
          slug: 'test-layout',
          type: 'page',
          grid_config: { columns: 12 },
          regions: [{ name: 'main' }],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Layout');
      testLayoutId = response.body.data.id;
    });
  });

  describe('GET /layouts', () => {
    it('should list layouts', async () => {
      const response = await request(app).get('/api/test/admin/ui/layouts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /components', () => {
    it('should create a component', async () => {
      const response = await request(app)
        .post('/api/test/admin/ui/components')
        .send({
          name: 'Test Component',
          slug: 'test-component',
          type: 'widget',
          category: 'dashboard',
          props_schema: { type: 'object' },
          default_props: {},
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Component');
      testComponentId = response.body.data.id;
    });
  });

  describe('GET /components', () => {
    it('should list components', async () => {
      const response = await request(app).get('/api/test/admin/ui/components');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /templates/:page', () => {
    it('should create/update a template', async () => {
      const response = await request(app)
        .put('/api/test/admin/ui/templates/test-page')
        .send({
          name: 'Test Page Template',
          layout_id: testLayoutId,
          theme_id: testThemeId,
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe('test-page');
    });
  });

  describe('GET /templates/:page', () => {
    it('should get template by page', async () => {
      const response = await request(app).get('/api/test/admin/ui/templates/test-page');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe('test-page');
    });

    it('should get resolved template', async () => {
      const response = await request(app).get('/api/test/admin/ui/templates/test-page?resolved=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.layout).toBeDefined();
      expect(response.body.data.theme).toBeDefined();
    });
  });

  describe('POST /widgets', () => {
    it('should create a widget', async () => {
      const response = await request(app)
        .post('/api/test/admin/ui/widgets')
        .send({
          component_id: testComponentId,
          page: 'test-page',
          region: 'main',
          position: 0,
          props: { title: 'Test Widget' },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe('test-page');
    });
  });

  describe('GET /widgets', () => {
    it('should list widgets', async () => {
      const response = await request(app).get('/api/test/admin/ui/widgets?page=test-page');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
