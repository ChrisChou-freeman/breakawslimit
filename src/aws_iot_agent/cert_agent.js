'use strict';
const AWS = require('aws-sdk');

const common = require('../../lib/common.js');
const logger = require('../../lib/logger.js');

try{
  AWS.config.loadFromPath( __dirname + '/config_local.json');
}catch(err){
  AWS.config.loadFromPath( __dirname + '/config.json');
}

const iot = new AWS.Iot();

class CertAgent{
  async registerCertificate(certPem, caCertPem){
    return new Promise((resolve) => {
      const returnData = {error: null, data: null};
      if(common.isEmptyString(certPem)
        || common.isEmptyString(caCertPem)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        certificatePem: certPem,
        caCertificatePem: caCertPem,
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

  async updateCertificate(certArn, newStatus='INACTIVE'){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(certArn)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const certID =  certArn.split(':')[5].split('/')[1]
      const params = {
        certificateId: certID,
        newStatus: newStatus,
      }
      iot.updateCertificate(params, (err, data)=>{
        if(err){
          returnData.error = new Error('updateCertificateErr');
          logger.loggerError.info({info: err.stack, source: 'updateCertificate'});
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  async deleteCertificate(certArn){
    return new Promise((resolve)=>{
      if(common.isEmptyString(certArn)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const certID =  certArn.split(':')[5].split('/')[1]
      const returnData = {error: null, data: null};
      const params = {
        certificateId: certID
      };
      iot.deleteCertificate(params, (err, data)=>{
        if(err){
          returnData.error = new Error('deleteCertificateErr');
          logger.loggerError.info({info: err.stack, source: 'deleteCertificate'});
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }
}

module.exports = CertAgent;
