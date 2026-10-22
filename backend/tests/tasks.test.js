require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/database');

describe('Task CRUD API', () => {
    let taskId;

    afterAll(async () => {
        await pool.end();
    });

    test('should create, retrieve, update and delete a task', async () => {
        // 1. CREATE
        const createResponse = await request(app)
            .post('/api/tasks')
            .send({
                title: 'Deploy CloudOps',
                description: 'Deploy the application to AWS',
                status: 'pending'
            });

        expect(createResponse.statusCode).toBe(201);
        expect(createResponse.body.success).toBe(true);

        taskId = createResponse.body.data.id;

        expect(createResponse.body.data.title).toBe('Deploy CloudOps');

        // 2. READ ALL
        const listResponse = await request(app)
            .get('/api/tasks');

        expect(listResponse.statusCode).toBe(200);
        expect(listResponse.body.success).toBe(true);
        expect(
            listResponse.body.data.some(task => task.id === taskId)
        ).toBe(true);

        // 3. READ ONE
        const getResponse = await request(app)
            .get(`/api/tasks/${taskId}`);

        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.body.data.id).toBe(taskId);

        // 4. UPDATE
        const updateResponse = await request(app)
            .patch(`/api/tasks/${taskId}`)
            .send({
                status: 'in_progress'
            });

        expect(updateResponse.statusCode).toBe(200);
        expect(updateResponse.body.data.status).toBe('in_progress');

        // 5. DELETE
        const deleteResponse = await request(app)
            .delete(`/api/tasks/${taskId}`);

        expect(deleteResponse.statusCode).toBe(200);

        // 6. VERIFY DELETION
        const verifyResponse = await request(app)
            .get(`/api/tasks/${taskId}`);

        expect(verifyResponse.statusCode).toBe(404);
    });
});