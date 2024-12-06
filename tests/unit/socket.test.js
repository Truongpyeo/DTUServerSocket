const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const io = require('socket.io-client');
const server = require('../../src/server');

describe('Socket.IO Tests', () => {
  let clientSocket;

  before((done) => {
    clientSocket = io('http://localhost:3555');
    clientSocket.on('connect', done);
  });

  after(() => {
    clientSocket.close();
  });

  it('should emit clients_count on connection', (done) => {
    clientSocket.on('clients_count', (count) => {
      expect(count).to.be.a('number');
      done();
    });
  });
}); 