'use strict';
const Events = require('events');

const awsLimit = require('./aws_iot_agent/limit.js');
const conf = require('../conf.js');
const logger = require('../lib/logger.js');
const redisCli = require('../lib/redis.js');
const tools = require('./tools.js');
const certManage = require('./aws_iot_agent/cert_agent.js');
const policyManage = require('./aws_iot_agent/policy_agent.js');
const thingManage = require('./aws_iot_agent/thing_agent.js');
const common = require('../lib/common.js');

const ServerFeedbackEvent = new Events();

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

function registerEvent(eventValue, callback){
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

/**
  * recieve data form
  {
    ca: "",
    certificate: "",
    thingName: "",
    policyName: "xxx",
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

  registerEvent(md5Value, callback);
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

async function handelResult(args){
  const taskName = args.taskName;
  const currentQueueName = args.currentQueueName;
  const nextQueueName = conf.queueConfig[taskName][step+1];
  const dataResult = args.dataResult;
  const dataPool = args.dataPool;
  const redisConn = args.redisConn;
  const step = args.step;
  const i = args.resultIndex;
  const errorEvnentName  = args.dataPool[i].md5Value + '_Error';
  const successEventName = args.dataPool[i].md5Value + '_Success';
  const putArgs = args.putArgs;
  const subMession = conf.queueConfig[taskName][step]['subMession'];
  const subMessionIndex = args.subMessionIndex;
  const subMessionLength = args.subMessionLength;

  if(dataResult.error){
    if(dataPool[i].errTime === undefined){
      dataPool[i].errTime = 0;
    }
    if(dataPool[i].errTime >= ERROR_TIME_LIMIT){
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

  if(step>=conf.queueConfig[taskName].length){
    await deleteTask({
      redisConn: redisConn,
      md5Value: dataPool[i].md5Value
    });
    triggerEvent(successEventName);
    return;
  }

  for(let i=0;i<putArgs.length;i++){
    const element = putArgs[i];
    if(element.startsWith('subMession:')){
      const argName = element.split(':')[1];
      const argsAliaName = element.split(':')[2];
      if(dataPool[i][argsAliaName] == undefined){
        dataPool[i][argsAliaName] = [];
      }
      dataPool[i][argsAliaName].push(dataResult.data[argName]);
    }else{
      dataPool[i][putArgs[i]] = dataResult.data[element];
    }
  }

  let pushResult2;
  if(subMession === undefined){
    pushResult2 = await redisConn.lpush(nextQueueName, JSON.stringify(dataPool[i]));
  }else{
    const subMessionProcessName = `${subMession}Process`;
    if(dataPool[i][subMessionProcessName]===undefined){
      dataPool[i][subMessionProcessName] = 0;
    }
    dataPool[i][subMessionProcessName]++;
    if(subMessionIndex == subMessionLength-1){
      if(dataPool[i][subMessionProcessName] >= dataPool[i][subMession].length){
        pushResult2 = await redisConn.lpush(nextQueueName, JSON.stringify(dataPool[i]));
      }else{
        pushResult2 = await redisConn.lpush(currentQueueName, JSON.stringify(dataPool[i]));
      }
    }
  }

  if(pushResult2 != undefined && pushResult2.error){
    logger.loggerError.info(`${currentQueueName} Step${step} Err2>>`, pushResult2.error.stack);
    await deleteTask({
      redisConn: redisConn,
      md5Value: dataPool[i].md5Value
    });
    triggerEvent(errorEvnentName);
  }
}

async function sendTask(args){
  taskStepStatus[taskName][step] = true;
  const step = args.step;
  const redisConn = args.redisConn;
  const certObj = args.certObj;
  const policyObj = args.policyObj;
  const thingObj = args.thingObj;
  const taskName = args.taskName;
  const currentQueueName = conf.queueConfig[taskName][step].name;
  const funcName= currentQueueName.split('_')[1];
  const taskNumber = await redisConn.llen(currentQueueName);
  const promiseList = [];
  const promiseListSubs = [];
  const dataPool = [];
  const taskFunctin = certObj[funcName] || policyObj[funcName] || thingObj[funcName];
  const subMession = conf.queueConfig[taskName][step]['subMession'];

  if(!taskFunctin){
    logger.loggerError.info('sendTaskFuncNameErr>>', funcName);
    return;
  }

  for(let i=0;i<taskNumber.data;i++){
    if(ActionValue[funcName]<= 0){
      break;
    }

    const jsonData = await popQueueItem({
      queName: currentQueueName,
      redisConn: redisConn
    });
    const objData = JSON.parse(jsonData.data);
    dataPool.push(objData);

    if(subMession === undefined){
      const drawData = conf.queueConfig[taskName][step]['drawData'];
      const drawDataArgs = [];
      for(let j=0;j<drawData.length;j++){
        drawDataArgs.push(objData[drawData[j]]);
      }
      ActionValue[funcName]--;
      promiseList.push(
        taskFunctin(...drawDataArgs)
      );
    }else{
      const subPromiseList = [];
      const drawData = conf.queueConfig[taskName][step]['drawData'];
      for(let j=0;j<objData[subMession].length;j++){
        if(ActionValue[funcName]<= 0){
          break;
        }
        const drawDataArgs = [];
        for(let k=0;k<drawData.length;k++){
          const element = drawData[k];
          if(element.startsWith('subMession:')){
            const subMessionKey = element.split(':')[1];
            if(subMessionKey == 'index'){
              drawDataArgs.push(objData[subMession][j]);
            }else{
              drawDataArgs.push(objData[subMession][subMessionKey]);
            }
          }else if(element.startsWith('addtion:')){
            const splitElement = element.split(':')
            const argName = splitElement[2];
            const addtionElement = splitElement[1]
            const argValue = objData[argName];
            if(addtionElement == 'index'){
              drawDataArgs.push(argValue + j);
            }
          }else{
            drawDataArgs.push(objData[element]);
          }
        }
        ActionValue[funcName]--;
        subPromiseList.push(taskFunctin(...drawDataArgs));
      }
      promiseListSubs.push(subPromiseList);
    }
  }

  if(promiseList.length>0 && subMession=== undefined){
    const resultList = await Promise.all(promiseList);
    for(let i=0;i<resultList.length;i++){
      if(resultList[i]===null){
        continue;
      }
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
  }else if(promiseListSubs.length>0){
    promiseListSubs.map((a)=>{return Promise.all(a);});
    const promiseListSubsResult = await Promise.all(promiseListSubs);
    for(let i=0;i<promiseListSubsResult.length;i++){
      const subResultElement = promiseListSubs[i];
      for(let j=0;j<subResultElement.length;j++){
        await handelResult({
          taskName: taskName,
          currentQueueName: currentQueueName,
          dataResult: subResultElement[j],
          dataPool: dataPool,
          redisConn: redisConn,
          step: step,
          resultIndex: i,
          putArgs: conf.queueConfig[taskName][step]['putArgs'],
          subMessionIndex: j,
          subMessionLength: subResultElement.length
        });
      }
    }
  }

  taskStepStatus[taskName][step] = false;
  return;
}

function resetAvtionValue(){
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
        for(let step=0;step<conf.queueConfig[taskName].length;step++){
          if(taskStepStatus[taskName] === undefined){
            taskStepStatus[taskName] = {};
          }
          if(taskStepStatus[taskName][step] === undefined){
            taskStepStatus[taskName][step] = false;
          }

          if(taskStepStatus[taskName][step] === false){
            sendTask({
              step: step,
              redisConn: redisConn,
              certObj: certObj,
              policyObj: policyObj,
              thingObj: thingObj,
              taskName: taskName
            });
          }
        }
      }
      resetAvtionValue();
    }, 1000);
  }
}

module.exports = {
  createCert,
  updateCert,
  revokeCert,
  startTask
}
