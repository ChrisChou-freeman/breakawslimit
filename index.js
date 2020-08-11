'use strict';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const conf = require('./conf.js');
const limitBufferService = require('./src/limitBufferService.js');

const packageDefinition = protoLoader.loadSync(
  conf.protosPath,
  {keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true}
);
const limit_server_buffer = grpc.loadPackageDefinition(packageDefinition).myserver;

function createServer(){
  const server = new grpc.Server();
  server.addService(
    limit_server_buffer.Greeter.service,
    {
      createCert: limitBufferService.createCert,
      updateCert: limitBufferService.updateCert,
      revokeCert: limitBufferService.revokeCert
    }
  );
  return server;
}

function main() {
  const server = createServer()
  server.bind(`${conf.serverHost}:${conf.serverPort}`, grpc.ServerCredentials.createInsecure());
  console.log(`server start at:${conf.serverHost}:${conf.serverPort}`)
  server.start();
  limitBufferService.startTask();
}

if(require.main.filename == __filename){
  main();
}
