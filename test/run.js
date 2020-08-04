'use strict';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const conf = require('../conf.js');
const testCreateCert = require('./test_createCert');
const testUpdateCert = require('./test_updateCert');

const packageDefinition = protoLoader.loadSync(
  conf.protosPath,
  {keepCase: true,
   longs: String,
   enums: String,
   defaults: true,
   oneofs: true}
);
const proto = grpc.loadPackageDefinition(packageDefinition).myserver;

function main() {
  const client = new proto.Greeter(
    'localhost:50055',
    grpc.credentials.createInsecure()
  );
  testCreateCert(client, 'test_policy_chris1', 10);
  testCreateCert(client, 'test_policy_chris2', 10);
  // testCreateCert(client, 'test_policy_chris3');
  // testUpdateCert(client);
}

main();
