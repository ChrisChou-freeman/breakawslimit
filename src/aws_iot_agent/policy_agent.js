'use strict';
const AWS = require('aws-sdk');

const common = require('../../lib/common.js');
const logger = require('../../lib/logger.js');

AWS.config.loadFromPath( './config.json');

const iot = new AWS.Iot();

class PolicyAgent{
  listTargetsForPolicy(policyName){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(policyName)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        policyName: policyName
      };
      iot.listTargetsForPolicy(params, function(err, data) {
        if(err){
          returnData.error = new Error('listTargetsForPolicyErr');
          logger.loggerError.info({info: err.stack, source: 'listTargetsForPolicy'});
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  detachPolicy(policyName, target){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(policyName)
        || common.isEmptyString(target)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        policyName: policyName,
        target: target
      };
      iot.detachPolicy(params, function(err, data) {
        if(err){
          returnData.error = new Error('detachPolicyErr');
          logger.loggerError.info({info: err.stack, source: 'detachPolicy'});
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  deletePolicy(policyName){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(policyName)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        policyName: policyName
      };
      iot.deletePolicy(params, function(err, data) {
        if (err){
          returnData.error = new Error('deletePolicy');
          logger.loggerError.info({info: err.stack, source: 'deletePolicy'});
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  createPolicy(policyName, policyDoc){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(policyName)
        ||common.isEmptyString(policyDoc)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        policyDocument: policyDoc, /* required */
        policyName: policyName /* required */
      };
      iot.createPolicy(params, function(err, data) {
        if (err){
          returnData.error = new Error('createPolicyErr');
          logger.loggerError.info({info: err.stack, source: 'deletePolicy'});
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  attachPolicy(policyName, target){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(policyName)
        ||common.isEmptyString(target)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        policyName: policyName,
        target: target
      };
      iot.attachPolicy(params, function(err, data) {
        if(err){
          returnData.error = new Error('attachPolicyErr');
          logger.loggerError.info({info: err.stack, source: 'attachPolicy'});
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  listAttachedPolicies(target){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(target)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        target: target
      };
      iot.listAttachedPolicies(params, function(err, data) {
        if (err){
          returnData.error = new Error('listAttachedPoliciesErr');
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
}

module.exports = PolicyAgent;
