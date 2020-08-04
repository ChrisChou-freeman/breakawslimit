'use strict';
const redis = require('redis');
const conf = require('../conf');

class RedisClient{
  constructor(){
    const sourceClass = this.constructor;
    if (!sourceClass['single']) {
      this.redisClient = redis.createClient({
        host: conf.redis.redisHost,
        port: conf.redis.redisPort
      });
      sourceClass['single'] = this;
    }
    return sourceClass['single'];
  }

  async connect(){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      if(this.redisClient.connected){
        resolve(returnData);
        return;
      }else{
        this.redisClient.on('connect', ()=>{
          resolve(returnData);
        });
        this.redisClient.on('error', (error)=>{
          returnData.error = error;
          resolve(returnData);
        });
      }
    });
  }

  async sismember(queueName, value){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.sismember(queueName, value, (err, member)=>{
        if(err){
          returnData.error = err;
          resolve(returnData);
          return;
        }
        returnData.data = member ? true: false;
        resolve(returnData);
        return;
      });
    });
  }

  async llen(queueName){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.llen(queueName, (error, number)=>{
        if(error){
          returnData.error = error;
          resolve(returnData);
          return;
        }
        returnData.data = number;
        resolve(returnData);
        return;
      });
    });
  }

  async rpop(queueName){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.rpop(queueName, (error, data)=>{
        if(error){
          returnData.error = error;
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  async lpush(queueName, value){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.lpush(queueName, value, (error, data)=>{
        if(error){
          returnData.error = error;
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  async sadd(queueName, value){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.sadd(queueName, value, (error, data)=>{
        if(error){
          returnData.error = error;
          resolve(returnData);
          return;
        }
        returnData.data = data;
        resolve(returnData);
        return;
      });
    });
  }

  async srem(queueName, value){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.srem(queueName, value, (error, number)=>{
        if(error){
          returnData.error = error;
          resolve(returnData);
          return;
        }
        returnData.data = number;
        resolve(returnData);
        return;
      });
    });
  }

  async del(queueName){
    return new Promise((resolve)=>{
      const returnData = {error: null, data: null};
      this.redisClient.del(queueName, (error, data)=>{
        if(error){
          returnData.error = error;
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

module.exports = RedisClient;
