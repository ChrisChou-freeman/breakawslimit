'use strict';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const conf = require('../conf');

const packageDefinition = protoLoader.loadSync(
  conf.protosPath,
  {keepCase: true,
   longs: String,
   enums: String,
   defaults: true,
   oneofs: true}
);
const proto = grpc.loadPackageDefinition(packageDefinition).myserver;
const serverHost = `${conf.serverHost}:${conf.serverPort}`;

class CertManagerClient{
  constructor(){
    this.client = new proto.Greeter(
      serverHost,
      grpc.credentials.createInsecure()
    );
  }

  async requestSender(args){
    return new Promise((resolve)=>{
      const {
        option,
        data,
      } = args;
      const returnData = {error: null, data: null};
      const packData = {data: JSON.stringify(data)}
      this.client[option](packData, (err, response)=>{
        if(err){
          returnData.error = err;
          resolve(returnData);
          return;
        }
        returnData.data = response;
        resolve(returnData);
        return;
      });
    });
  }

  async createCert(args){
    const {
      ca,
      certificate,
      thingName,
      policyName,
      policies
    } = args;
    const requestData = {
      ca,
      certificate,
      thingName,
      policyName,
      policies
    };
    const result = await this.requestSender({
      option: 'createCert',
      data: requestData
    });
    return result;
  }

  async updateCert(args){
    const {
      certificateArn,
      policyName,
      policies
    } = args;
    const requestData = {
      certificateArn,
      policyName,
      policies
    };
    const result = await this.requestSender({
      option: 'updateCert',
      data: requestData
    });
    return result;
  }

  async revokeCert(args){
    const {
      certificateArn,
      thingName
    } = args;
    const requestData = {
      certificateArn,
      thingName
    };
    const result = await this.requestSender({
      option: 'revokeCert',
      data: requestData
    });
    return result;
  }
}

module.exports = CertManagerClient;
