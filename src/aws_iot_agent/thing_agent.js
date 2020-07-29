'use strict';
const AWS = require('aws-sdk');

const common = require('../../lib/common.js');
const logger = require('../../lib/logger.js');

AWS.config.loadFromPath( './config.json');

const iot = new AWS.Iot();

class ThingAgent{
  async detachThingPrincipal(principal, thingName){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(thingName)
        || common.isEmptyString(principal)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        principal: principal,
        thingName: thingName
      };
      iot.detachThingPrincipal(params, (err, data)=>{
        if(err){
          returnData.error = new Error('detachThingPrincipalErr');
          logger.loggerError.info({info: err.stack, source: 'detachThingPrincipal'});
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  async attachThingPrincipal(principal, thingName){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      if(common.isEmptyString(principal)
        || common.isEmptyString(thingName)){
        returnData.error = new Error('ErrRequest');
        resolve(returnData);
        return;
      }
      const params = {
        principal: principal,
        thingName: thingName
      };
      iot.attachThingPrincipal(params, function(err, data) {
        if(err){
          returnData.error = new Error('attachThingPrincipalErr');
          logger.loggerError.info({info: err.stack, source: 'attachThingPrincipal'});
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

module.exports = ThingAgent;
