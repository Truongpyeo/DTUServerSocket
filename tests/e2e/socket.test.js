const request = require('supertest');
const io = require('socket.io-client');
const app = require('../../src/server');

describe('Socket.IO E2E Tests', () => {
  let clientSocket;
  
  beforeAll((done) => {
    clientSocket = io('http://localhost:3555');
    clientSocket.on('connect', done);
  });

  afterAll(() => {
    clientSocket.close();
    app.close();
  });

  test('should authenticate admin', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
}); 