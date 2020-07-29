'use strict';
const events = require('events');

const awsLimit = require('./aws_iot_agent/limit.js');
const conf = require('../conf.js');
const logger = require('../lib/logger.js');
const redisCli = require('../lib/redis.js');
const tools = require('./tools.js');
const certManage = require('./aws_iot_agent/cert_agent.js');
const policyManage = require('./aws_iot_agent/policy_agent.js');
const thingManage = require('./aws_iot_agent/thing_agent.js');
const common = require('../lib/common.js');

const ServerFeedbackEvent = new events();

let ActionValue = {
  attachPolicy:               awsLimit.AttachPolicy,
  attachThingPrincipal:       awsLimit.AttachThingPrincipal,
  attachPrincipalPolicy:      awsLimit.AttachPrincipalPolicy,
  createPolicy:               awsLimit.CreatePolicy,
  detachPrincipalPolicy:      awsLimit.DetachPrincipalPolicy,
  deleteCertificate:          awsLimit.DeleteCertificate,
  detachThingPrincipal:       awsLimit.DetachThingPrincipal,
  detachPolicy:               awsLimit.DetachPolicy,
  deletePolicy:               awsLimit.DeletePolicy,
  registerCertificate:        awsLimit.RegisterCertificate,
  listAttachedPolicies:       awsLimit.ListAttachedPolicies,
  listTargetsForPolicy:       awsLimit.ListTargetsForPolicy,
  updateCertificate:          awsLimit.UpdateCertificate,
};

const taskStepStatus = {};
const ERROR_TIME_LIMIT = 10;

async function checkHasMember(args){
  const returnData = {error: null, data: false};
  const redisConn = args.redisConn;
  const md5Value = args.md5Value;
  const isMember = await redisConn.sismember(conf.queueConfig.redisMainTaskSet, md5Value);
  if(isMember.error){
    returnData.error = new Error('503');
  }
  if(isMember.data){
    returnData.data = true;
    return returnData;
  }
  return returnData;
}

function createEvent(eventValue, callback){
  const taskSuccessEvent = eventValue + '_Success';
  const taskErrEvent = eventValue + '_Error';
  ServerFeedbackEvent.addListener(taskSuccessEvent, function(){
    const responseData = {status: true, info: 'Success'};
    callback(null, {response: JSON.stringify(responseData)});
    return;
  });

  ServerFeedbackEvent.addListener(taskErrEvent, function(){
    const responseData = {status: false, info: '503'};
    callback(null, {response: JSON.stringify(responseData)});
    return;
  });

}

function triggerEvent(eventName){
  ServerFeedbackEvent.emit(eventName);
  ServerFeedbackEvent.removeListener(eventName);
}

async function deleteTask(args){
  const returnData = {error: null, data: null};
  const md5Value = args.md5Value;
  const redisConn = args.redisConn;
  const queName = conf.queueConfig.redisMainTaskSet;
  const remResult = await redisConn.srem(queName, md5Value);
  if(remResult.error){
    logger.loggerError.info('deleteTaskErr>>', remResult.error.stack);
    returnData.error = new Error('deleteTaskErr');
    return returnData;
  }
  return returnData;
}

async function popQueueItem(args) {
  const returnData = {error: null, data: null};
  const queName = args.queName;
  const reconn = args.redisConn;
  const connectResult = await reconn.connect();
  if(connectResult.error){
    returnData.error = connectResult.error;
    return returnData;
  }

  const result = await reconn.rpop(queName);
  if(result.error){
    returnData.error = result.error;
    return returnData;
  }
  returnData.data = result.data;
  return returnData;
}

async function handelResult(args){
  const taskName = args.taskName;
  const currentQueueName = args.currentQueueName;
  const dataResult = args.dataResult;
  const dataPool = args.dataPool;
  const redisConn = args.redisConn;
  const step = args.step;
  const i = args.resultIndex;
  const errorEvnentName  = args.dataPool[i].md5Value + '_Error';
  const putArgs = args.putArgs;

  if(dataResult.error){
    if(dataPool[i].errTime === undefined){
      dataPool[i].errTime = 0;
    }
    if(dataPool[i].errTime>=ERROR_TIME_LIMIT){
      await deleteTask({
        redisConn: redisConn,
        md5Value: dataPool[i].md5Value
      });
      triggerEvent(errorEvnentName);
    }
    dataPool[i].errTime++;
    const pushResult = await redisConn.lpush(currentQueueName, JSON.stringify(dataPool[i]));
    if(pushResult.error){
      logger.loggerError.info(`${currentQueueName} Step${step} Err>>`, pushResult.error.stack);
      await deleteTask({
        redisConn: redisConn,
        md5Value: dataPool[i].md5Value
      });
      triggerEvent(errorEvnentName);
    }
  }

  for(let i=0;i<putArgs.length;i++){
    dataPool[i][putArgs[i]] = dataResult[putArgs[i]];
  }
  const nextQueueName = conf.queueConfig[taskName][step+1];
  const pushResult2 = await redisConn.lpush(nextQueueName, JSON.stringify(dataPool[i]));
  if(pushResult2.error){
    logger.loggerError.info(`${currentQueueName} Step${step} Err2>>`, pushResult2.error.stack);
    await deleteTask({
      redisConn: redisConn,
      md5Value: dataPool[i].md5Value
    });
    triggerEvent(errorEvnentName);
  }

}

// const createCertTaskQueue = [
//   // registerCert
//   async (args)=>{
//     const step = args.step;
//     const redisConn = args.redisConn;
//     const certObj = args.certObj;
//     const currentQueueName = conf.redis.CreateCertificateQueue[step];
//     const taskNumber = await redisConn.llen(currentQueueName);
//     const promiseList = [];
//     const dataPool = [];
//     for(let i=0;i<taskNumber;i++){
//       const taskName = currentQueueName.split('_')[1];
//       if(ActionValue[taskName]<= 0){
//         break;
//       }
//       ActionValue[taskName]--;
//       const jsonData = await popQueueItem({
//         queName: currentQueueName,
//         redisConn: redisConn
//       });
//       const objData = JSON.parse(jsonData.data);
//       dataPool.push(objData);
//       promiseList.push(
//         certObj.registerCertificate(objData.certificate, objData.ca)
//       );
//     }
//     if(promiseList.length>0){
//       const resultList = await Promise.all(promiseList);
//       for(let i=0;i<resultList.length;i++){
//         await handelResult({
//           taskName: 'CreateCertificateQueue',
//           currentQueueName: currentQueueName,
//           dataResult: resultList[i],
//           dataPool: dataPool,
//           redisConn: redisConn,
//           step: step,
//           resultIndex: i,
//           putArgs: ['certificateArn']
//         });
//       }
//     }
//     createCertStepStatus[step] = false;
//   },

//   async (args)=>{
//     const step = args.step;
//     const redisConn = args.redisConn;
//     const certObj = args.certObj;
//     const currentQueueName = conf.redis.CreateCertificateQueue[step];
//     const taskNumber = await redisConn.llen(currentQueueName);
//     const promiseList = [];
//     const dataPool = [];
//     for(let i=0;i<taskNumber;i++){
//       const taskName = currentQueueName.split('_')[1];
//       if(ActionValue[taskName]<= 0){
//         break;
//       }
//       ActionValue[taskName]--;
//       const jsonData = await popQueueItem({
//         queName: currentQueueName,
//         redisConn: redisConn
//       });
//       const objData = JSON.parse(jsonData.data);
//       dataPool.push(objData);
//       promiseList.push(
//         certObj.attachThingPrincipal(objData.certificateArn, objData.thingName)
//       );
//     }

//     if(promiseList.length>0){
//       const resultList = await Promise.all(promiseList);
//       for(let i=0;i<resultList.length;i++){
//         await handelResult({
//           taskName: 'CreateCertificateQueue',
//           currentQueueName: currentQueueName,
//           dataResult: resultList[i],
//           dataPool: dataPool,
//           redisConn: redisConn,
//           step: step,
//           resultIndex: i,
//           putArgs: []
//         });
//       }
//     }

//   },

//   async (args)=>{
//     const redisConn = args.redisConn;
//   }
// ]

async function sendTask(args){
  taskStepStatus[taskName][step] = true;
  const step = args.step;
  const redisConn = args.redisConn;
  const certObj = args.certObj;
  const policyObj = args.policyObj;
  const thingObj = args.thingObj;
  const taskName = args.taskName;
  const currentQueueName = conf.queueConfig[taskName][step];
  const funcName= currentQueueName.split('_')[1];
  const taskNumber = await redisConn.llen(currentQueueName);
  const promiseList = [];
  const dataPool = [];
  const taskFunctin = certObj[funcName] || policyObj[funcName] || thingObj[funcName];
  if(!taskFunctin){
    logger.loggerError.info('sendTaskFuncNameErr>>', funcName);
    return;
  }
  for(let i=0;i<taskNumber.data;i++){
    if(ActionValue[funcName]<= 0){
      break;
    }
    ActionValue[funcName]--;
    const jsonData = await popQueueItem({
      queName: currentQueueName,
      redisConn: redisConn
    });
    const objData = JSON.parse(jsonData.data);
    dataPool.push(objData);
    const drawData = conf.queueConfig[taskName][step]['drawData'];
    const drawDataArgs = [];
    for(let j=0;j<drawData.length;j++){
      drawDataArgs.push(objData[drawData[j]]);
    }
    promiseList.push(
      taskFunctin(...drawDataArgs)
    );
  }

  if(promiseList.length>0){
    const resultList = await Promise.all(promiseList);
    for(let i=0;i<resultList.length;i++){
      await handelResult({
        taskName: taskName,
        currentQueueName: currentQueueName,
        dataResult: resultList[i],
        dataPool: dataPool,
        redisConn: redisConn,
        step: step,
        resultIndex: i,
        putArgs: conf.queueConfig[taskName][step]['putArgs']
      });
    }
  }

  taskStepStatus[taskName][step] = false;
}

let taskEngine;
function startTask(){
  if(taskEngine === undefined){
    const redisConn = new redisCli();
    const certObj = new certManage();
    const policyObj = new policyManage();
    const thingObj = new thingManage();
    taskEngine = setInterval(()=>{
      for(let taskName in conf.queueConfig){
        if(typeof conf.queueConfig[taskName] == 'string'){
          continue;
        }
        for(let step in conf.queueConfig[taskName]){
          if(taskStepStatus[taskName] === undefined){
            taskStepStatus[taskName] = {};
          }
          if(taskStepStatus[taskName][step] === undefined){
            taskStepStatus[taskName][step] = false;
          }

          if(taskStepStatus[taskName][step] === false){
            sendTask({
              step: parseInt(step),
              redisConn: redisConn,
              certObj: certObj,
              policyObj: policyObj,
              thingObj: thingObj,
              taskName: taskName
            });
          }
        }
      }
      ActionValue = {
        attachPolicy:               awsLimit.AttachPolicy,
        attachThingPrincipal:       awsLimit.AttachThingPrincipal,
        attachPrincipalPolicy:      awsLimit.AttachPrincipalPolicy,
        createPolicy:               awsLimit.CreatePolicy,
        detachPrincipalPolicy:      awsLimit.DetachPrincipalPolicy,
        deleteCertificate:          awsLimit.DeleteCertificate,
        detachThingPrincipal:       awsLimit.DetachThingPrincipal,
        detachPolicy:               awsLimit.DetachPolicy,
        deletePolicy:               awsLimit.DeletePolicy,
        registerCertificate:        awsLimit.RegisterCertificate,
        listAttachedPolicies:       awsLimit.ListAttachedPolicies,
        listTargetsForPolicy:       awsLimit.ListTargetsForPolicy,
        updateCertificate:          awsLimit.UpdateCertificate,
      };
    }, 1000);
  }
}

/**
  * recieve data form
  {
    ca: "",
    certificate: "",
    thingName: "",
    needAttachPolicy: true/false,
    prefixOfpolicyName: "xxx",
    policies: [
        {...},
        {...},
    ],
  }
*/
async function createCert(req, callback){
  if(common.isEmptyString(req.request.data.ca)
    || common.isEmptyString(req.request.data.certificate)
    || common.isEmptyString(req.request.data.thingName)){
    const responseData = {status: false, info: 'ErrRequest'};
    callback(null, {response: JSON.stringify(responseData)});
  }
  const redisConn = new redisCli();
  const connectResult = await redisConn.connect();
  if(connectResult.error){
    logger.loggerError.info('redisConnErr>>', connectResult.error.stack);
    callback(null, {response: JSON.stringify({status: false, info: '503'})});
    return;
  }
  const md5Value = tools.genMd5(req.request.data);
  const hasMember = await checkHasMember({
    redisConn: redisConn,
    md5Value: md5Value
  });

  if(hasMember.error){
    const responseData = {status: false, info: hasMember.error.message};
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  if(hasMember.data){
    const responseData = {status: false, info: 'repeatRequestErr'};
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }

  const data = JSON.parse(req.request.data);
  data.md5Value = md5Value;
  const jsonData = JSON.stringify(data);
  const resultList = await Promise.all([
    redisConn.lpush(conf.queueConfig.CreateCertificateQueue[1], jsonData),
    redisConn.sadd(conf.queueConfig.redisMainTaskSet, md5Value)
  ]);
  const pushResult = resultList[0];
  const addResult = resultList[1];
  if(pushResult.error){
    const responseData = {status: false, info: '503'};
    logger.loggerError.info('CreateCertificateQueueLpushErr>>', pushResult.error.stack);
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  if(addResult.error){
    const responseData = {status: false, info: '503'};
    logger.loggerError.info('CreateCertificateQueueSaddErr>>', addResult.error.stack);
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }

  createEvent(md5Value, callback);
}

/**
  recieve data form
  {
    certificateARN: "xxx",
    prefixOfpolicyName: "xxx",
    policies: [
        {...},
        {...},
    ]
  }
*/
function updateCert(req, callback){
  const data = JSON.parse(req.request.data);
  console.log(data);
  callback(null, {response: req.request.data});
}

/**
  * recieve data form
  {
    certificateARN: "xxx",
  }
*/
function revokeCert(req, callback){
  const data = JSON.parse(req.request.data);
  console.log(data);
  callback(null, {response: req.request.data});
}


module.exports = {
  createCert,
  updateCert,
  revokeCert,
  startTask
}
