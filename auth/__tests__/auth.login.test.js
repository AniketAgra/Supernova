const request = require('supertest');
const app = require('../src/app');

// DB connection is handled by test/setup.js

describe('POST /api/auth/login', () => {
    it('logs in a user and returns 200 with user (no password)', async () => {
        // First, register a user
        const registerPayload = {
            username: 'john_login',
            email: 'john.login@example.com',
            password: 'Secret123!',
            fullName: { firstName: 'John', lastName: 'Login' },
        };
        await request(app).post('/api/auth/register').send(registerPayload).expect(201);

        // Then, attempt to login with correct credentials
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'john.login@example.com',
                password: 'Secret123!',
            });

        expect(res.status).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe('john_login');
        expect(res.body.user.email).toBe('john.login@example.com');
        expect(res.body.user.password).toBeUndefined();
    });

    it('rejects wrong password with 401', async () => {
        const registerPayload = {
            username: 'wrongpassuser',
            email: 'wrongpass@example.com',
            password: 'CorrectPass1!',
            fullName: { firstName: 'Wrong', lastName: 'Pass' },
        };
        await request(app).post('/api/auth/register').send(registerPayload).expect(201);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'wrongpass@example.com',
                password: 'IncorrectPass1!',
            });

        expect(res.status).toBe(401);
    });

    it('validates missing fields with 400', async () => {
        const res = await request(app).post('/api/auth/login').send({});
        expect(res.status).toBe(400);
    });
});
