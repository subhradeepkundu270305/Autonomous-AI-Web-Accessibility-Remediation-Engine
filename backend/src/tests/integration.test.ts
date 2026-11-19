import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';

/**
 * Integration tests for the scan pipeline core.
 * These run against a real Express instance but mock external services.
 *
 * NOTE: These tests require the environment variables to be set.
 * Run with: cd backend && npm test
 */

describe('Health endpoint', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

describe('POST /api/scans — URL validation', () => {
  it('rejects missing targetUrl', async () => {
    const res = await request(app)
      .post('/api/scans')
      .send({})
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects non-http URLs', async () => {
    const res = await request(app)
      .post('/api/scans')
      .send({ targetUrl: 'ftp://example.com' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('rejects private/local IP addresses (SSRF guard)', async () => {
    const res = await request(app)
      .post('/api/scans')
      .send({ targetUrl: 'http://192.168.1.1' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/private/i);
  });

  it('rejects localhost URLs', async () => {
    const res = await request(app)
      .post('/api/scans')
      .send({ targetUrl: 'http://localhost:3000' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/scans/:id', () => {
  it('returns 404 for non-existent scan ID', async () => {
    const res = await request(app).get('/api/scans/non-existent-id-12345');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/register', () => {
  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: '1234' });
    expect(res.status).toBe(400);
  });
});

describe('URL Validator unit tests', () => {
  it('validates proper URL', async () => {
    const { validateUrl } = await import('../src/utils/urlValidator');
    expect(validateUrl('https://example.com').valid).toBe(true);
  });

  it('rejects 127.0.0.1', async () => {
    const { validateUrl } = await import('../src/utils/urlValidator');
    const result = validateUrl('http://127.0.0.1/admin');
    expect(result.valid).toBe(false);
  });

  it('rejects non-http protocol', async () => {
    const { validateUrl } = await import('../src/utils/urlValidator');
    const result = validateUrl('file:///etc/passwd');
    expect(result.valid).toBe(false);
  });
});

describe('Score calculator', () => {
  it('returns 100 for no issues', async () => {
    const { computeScore } = await import('../src/modules/rules-engine');
    expect(computeScore([])).toBe(100);
  });

  it('penalizes critical issues by 15 each', async () => {
    const { computeScore } = await import('../src/modules/rules-engine');
    const issues = [
      { ruleId: 'x', description: '', severity: 'critical', wcagCriteria: '', elementHtml: '', selector: '' },
      { ruleId: 'y', description: '', severity: 'critical', wcagCriteria: '', elementHtml: '', selector: '' },
    ];
    expect(computeScore(issues)).toBe(70);
  });

  it('floors score at 0', async () => {
    const { computeScore } = await import('../src/modules/rules-engine');
    const issues = Array(10).fill({
      ruleId: 'x', description: '', severity: 'critical', wcagCriteria: '', elementHtml: '', selector: ''
    });
    expect(computeScore(issues)).toBe(0);
  });
});
