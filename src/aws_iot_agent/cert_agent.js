'use strict';
const AWS = require('aws-sdk');

const common = require('../../lib/common.js');
const logger = require('../../lib/logger.js');

AWS.config.loadFromPath( './config.json');

const iot = new AWS.Iot();

class CertAgent{
  constructor(args={}){
    this.arn = args.arn;
    this.certPem = args.certPem;
    this.caCertPem = args.caCertPem;
    this.thingName = args.thingName;
  }

  async registerCertificate(){
    return new Promise((resolve) => {
      const returnData = {error: null, data: null};
      if(common.isEmptyString(this.certPem)
        || common.isEmptyString(this.caCertPem)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        certificatePem: this.certPem,
        caCertificatePem: this.caCertPem,
        status: 'ACTIVE'
      };
      iot.registerCertificate(params, function(err, data) {
        if (err){
          returnData.error = new Error('registerCertificateErr');
          logger.loggerError.info({info: err.stack, source: 'registerCertificate'});
          resolve(returnData);
          return;
        }else{
          returnData.data = data;
          resolve(returnData);
          return;
        }
      });
    });
  }

  async listAttachedPolicies(){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(this.arn)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        target: this.arn,
      };
      iot.listAttachedPolicies(params, function(err, data) {
        if (err){
          returnData.error = new Error('listAttachedPolicies');
          logger.loggerError.info({info: err.stack, source: 'listAttachedPolicies'});
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  async attachThingPrincipal(){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(this.arn)
        || common.isEmptyString(this.thingName)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        principal: this.arn,
        thingName: this.thingName
      };
      iot.attachThingPrincipal(params, function(err) {
        if(err){
          returnData.error = new Error('attachThingPrincipalErr');
          logger.loggerError.info({info: err.stack, source: 'attachThingPrincipal'});
          resolve(returnData);
          return;
        }
        resolve(returnData);
        return;
      });
    });
  }
}

module.exports = CertAgent;
