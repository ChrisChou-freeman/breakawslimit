const conf = require('./conf.js');

var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    conf.protosPath,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var hello_proto = grpc.loadPackageDefinition(packageDefinition).myserver;

function main() {
  var client = new hello_proto.Greeter('localhost:50055',
                                       grpc.credentials.createInsecure());
  client.createPuserCert({data: JSON.stringify({info: 'hello', type: 'greeter'})}, function(err, response) {
    console.log(response);
    console.log('Greeting:', response);
  });
}

main();
