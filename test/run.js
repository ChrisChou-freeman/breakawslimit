'use strict';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const conf = require('../conf.js');
const testCreateCert = require('./test_createCert');
const testUpdateCert = require('./test_updateCert');
const testRevokeCert = require('./test_revokeCert');

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
  // testCreateCert(client, 'test_policy_chris1', 10);
  // testCreateCert(client, 'test_policy_chris2', 10);
  // testCreateCert(client, 'test_policy_chris3');
  // testUpdateCert(client);
  // testRevokeCert(client, 'arn:aws:iot:us-west-2:222294582284:cert/41fc3eb2cb34713b7ea6affb7a17a4a4b866af0f022b81bdc838300b8f5cba1d');
  // testRevokeCert(client, 'arn:aws:iot:us-west-2:222294582284:cert/20d844144091aa32030ddae9f31f217e45f63468b30de2bed7662f28822564e8');
}

main();
