'use strict';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const conf = require('./conf.js');
const createPuserCert = require('./src/createPuserCert.js');

const packageDefinition = protoLoader.loadSync(
  conf.protosPath,
  {keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true}
);
const limit_server_buffer = grpc.loadPackageDefinition(packageDefinition).myserver;

function main() {
  const server = new grpc.Server();
  server.addService(
    limit_server_buffer.Greeter.service,
    {
      createPuserCert: createPuserCert.main
    }
  );
  server.bind('0.0.0.0:50055', grpc.ServerCredentials.createInsecure());
  server.start();
}

main();
