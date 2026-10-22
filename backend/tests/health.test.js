const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
    test('should return 200 for health check', async () => {
        const response = await request(app).get('/health');

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('CloudOps API is running');
    });
});