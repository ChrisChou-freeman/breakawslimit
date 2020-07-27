const redis = require('redis');
const conf = require('../conf');
const logger = require('./logger');

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
          logger.loggerError.error('redisConnectErr', error.stack);
          returnData.error = new Error('redisConnectErr');
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
          logger.loggerError.error('sismemberErr>>', err.stack);
          returnData.error = new Error('sismemberErr');
        }
        returnData.data = member ? true: false;
        resolve(returnData);
      });
    });
  }

  async llen(queueName){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.llen(queueName, (error, number)=>{
        if(error){
          logger.loggerError.error('llenErr>>>', error.stack);
          returnData.error = new Error('llenErr');
        }
        returnData.data = number;
        resolve(returnData);
      });
    });
  }

  async rpop(queueName){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.rpop(queueName, (error, data)=>{
        if(error){
          logger.loggerError.error('rpopErr>>>', error.stack);
          returnData.error = new Error('rpopErr');
        }
        returnData.data = data;
        resolve(returnData);
      });
    });
  }

  async lpush(queueName, value){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.lpush(queueName, value, (error, data)=>{
        if(error){
          logger.loggerError.error('rpopErr>>>', error.stack);
          returnData.error = new Error('rpopErr');
        }
        returnData.data = data;
        resolve(returnData);
      });
    });
  }

  async sadd(queueName, value){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.sadd(queueName, value, (error, data)=>{
        if(error){
          logger.loggerError.error('rpopErr>>>', error.stack);
          returnData.error = new Error('rpopErr');
        }
        returnData.data = data;
        resolve(returnData);
      });
    });
  }

  async srem(queueName, value){
    return new Promise((resolve)=>{
      let returnData = {error: null, data: null};
      this.redisClient.srem(queueName, value, (error, number)=>{
        if(error){
          logger.loggerError.error('sremErr>>>', error.stack);
          returnData.error = new Error('sremErr');
        }
        returnData.data = number;
        resolve(returnData);
      });
    });
  }
}

module.exports = RedisClient;
