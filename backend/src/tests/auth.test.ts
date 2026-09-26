import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { uniqueEmail } from './helpers';

describe('Auth', () => {
  it('registers a new user', async () => {
    const email = uniqueEmail('register');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate email registration', async () => {
    const email = uniqueEmail('dup');
    await request(app).post('/api/auth/register').send({ name: 'Test', email, password: 'password123' });
    const res = await request(app).post('/api/auth/register').send({ name: 'Test 2', email, password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects short passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: uniqueEmail('short'), password: '123' });

    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const email = uniqueEmail('login');
    await request(app).post('/api/auth/register').send({ name: 'Test', email, password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('blocks access to protected routes without auth', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns current user for authenticated session', async () => {
    const email = uniqueEmail('me');
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Test', email, password: 'password123' });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it('clears session on logout', async () => {
    const email = uniqueEmail('logout');
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Test', email, password: 'password123' });

    await agent.post('/api/auth/logout');
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
