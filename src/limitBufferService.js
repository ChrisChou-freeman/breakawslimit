'use strict';
const util = require('util');
const Events = require('events');

const conf = require('../conf.js');
const logger = require('../lib/logger.js');
const redisCli = require('../lib/redis.js');
const tools = require('../lib/tools.js');
const awsIotAgent = require('./aws_iot_agent');
const common = require('../lib/common.js');

const ServerFeedbackEvent = new Events();
const ERROR_TIME_LIMIT = 10;

let ActionValue = {
  attachPolicy:               awsIotAgent.limit.AttachPolicy,
  attachThingPrincipal:       awsIotAgent.limit.AttachThingPrincipal,
  attachPrincipalPolicy:      awsIotAgent.limit.AttachPrincipalPolicy,
  createPolicy:               awsIotAgent.limit.CreatePolicy,
  detachPrincipalPolicy:      awsIotAgent.limit.DetachPrincipalPolicy,
  deleteCertificate:          awsIotAgent.limit.DeleteCertificate,
  detachThingPrincipal:       awsIotAgent.limit.DetachThingPrincipal,
  detachPolicy:               awsIotAgent.limit.DetachPolicy,
  deletePolicy:               awsIotAgent.limit.DeletePolicy,
  registerCertificate:        awsIotAgent.limit.RegisterCertificate,
  listAttachedPolicies:       awsIotAgent.limit.ListAttachedPolicies,
  listTargetsForPolicy:       awsIotAgent.limit.ListTargetsForPolicy,
  updateCertificate:          awsIotAgent.limit.UpdateCertificate,
};

const taskStepStatus = {};

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
  ServerFeedbackEvent.removeListener(eventName, ()=>{});
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
  const responseData = {status: false, info: ''};
  const requestData = JSON.parse(req.request.data);
  console.log('start createCert>>>');
  if(common.isEmptyString(requestData.ca)
    || common.isEmptyString(requestData.certificate)
    || common.isEmptyString(requestData.thingName)){
    responseData.info = 'ErrRequest';
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  const redisConn = new redisCli();
  const connectResult = await redisConn.connect();
  if(connectResult.error){
    logger.loggerError.info('redisConnErr>>', connectResult.error.stack);
    responseData.info = '503';
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  const md5Value = tools.genMd5(req.request.data);
  const hasMember = await checkHasMember({
    redisConn: redisConn,
    md5Value: md5Value
  });

  if(hasMember.error){
    responseData.info = hasMember.error.message;
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  if(hasMember.data){
    responseData.info = 'repeatRequestErr';
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }

  requestData.md5Value = md5Value;
  const jsonData = JSON.stringify(requestData);
  const resultList = await Promise.all([
    redisConn.lpush(conf.queueConfig.CreateCertificateQueue[0].name, jsonData),
    redisConn.sadd(conf.queueConfig.redisMainTaskSet, md5Value)
  ]);
  const pushResult = resultList[0];
  const addResult = resultList[1];
  if(pushResult.error){
    responseData.info = '503';
    logger.loggerError.info('CreateCertificateQueueLpushErr>>', pushResult.error.stack);
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  if(addResult.error){
    responseData.info = '503';
    logger.loggerError.info('CreateCertificateQueueSaddErr>>', addResult.error.stack);
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }

  registerEvent(md5Value, callback);
}

/**
  recieve data form
  {
    certificateArn: "xxx",
    policyName: "xxx",
    policies: [
        {...},
        {...},
    ]
  }
*/
async function updateCert(req, callback){
  const responseData = {status: false, info: ''};
  const requestData = JSON.parse(req.request.data);
  console.log('start updateCert>>>');
  if(common.isEmptyString(requestData.certificateArn)
    || common.isEmptyString(requestData.policyName)
    || common.isEmptyArray(requestData.policies)){
    responseData.info = 'ErrRequest';
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  const redisConn = new redisCli();
  const connectResult = await redisConn.connect();
  if(connectResult.error){
    logger.loggerError.info('redisConnErr>>', connectResult.error.stack);
    responseData.info = '503';
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  const md5Value = tools.genMd5(req.request.data);
  const hasMember = await checkHasMember({
    redisConn: redisConn,
    md5Value: md5Value
  });

  if(hasMember.error){
    responseData.info = hasMember.error.message;
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  if(hasMember.data){
    responseData.info = 'repeatRequestErr';
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }

  requestData.md5Value = md5Value;
  const jsonData = JSON.stringify(requestData);
  const resultList = await Promise.all([
    redisConn.lpush(conf.queueConfig.UpdatCertificateQueue[0].name, jsonData),
    redisConn.sadd(conf.queueConfig.redisMainTaskSet, md5Value)
  ]);
  const pushResult = resultList[0];
  const addResult = resultList[1];
  if(pushResult.error){
    responseData.info = '503';
    logger.loggerError.info('updateCertificateQueueLpushErr>>', pushResult.error.stack);
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  if(addResult.error){
    responseData.info = '503';
    logger.loggerError.info('updateCertificateQueueSaddErr>>', addResult.error.stack);
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }

  registerEvent(md5Value, callback);
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
  const dataResult = args.dataResult;
  const dataPool = args.dataPool;
  const redisConn = args.redisConn;
  let step = args.step;
  const i = args.resultIndex;
  const errorEvnentName  = args.dataPool[i].md5Value + '_Error';
  const successEventName = args.dataPool[i].md5Value + '_Success';
  const putArgs = args.putArgs;
  const subMession = conf.queueConfig[taskName][step]['subMession'];
  const subMessionIndex = args.subMessionIndex;
  const subMessionLength = args.subMessionLength;
  const jumpCondition = conf.queueConfig[taskName][step]['jumpCondition'];
  let jumpValue = null;

  console.log('dataResult>>>', dataResult);

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
      return;
    }
    return;
  }

  if(!common.isEmptyObj(dataResult.data)){
    for(let i=0;i<putArgs.length;i++){
      const element = putArgs[i];
      if(element.startsWith('subMession:')){
        let argName = element.split(':')[1];
        const argsAliaName = element.split(':')[2];
        console.log('dataResult__data>>>', dataResult.data);
        console.log('argName>>>', argName);
        if(dataPool[i][argsAliaName] == undefined){
          dataPool[i][argsAliaName] = [];
        }
        if(util.isArray(dataResult.data[argName])){
          for(let j=0;j<dataResult.data[argName].length;j++){
            let element2 = dataResult.data[argName][j];
            dataPool[i][argsAliaName].push(element2);
          }
        }else{
          const pushData = dataResult.data[argName];
          dataPool[i][argsAliaName].push(pushData);
        }
      }else{
        dataPool[i][element] = dataResult.data[element];
      }
    }
  }

  if(jumpCondition != undefined){
    const conditionSplit = jumpCondition.split(':');
    const conditionArg = conditionSplit[0];
    const condition = conditionSplit[1];
    const jumpLocation = conditionSplit[2];
    switch(condition){
      case 'Empty':
        if(subMession != undefined
          && subMessionIndex == subMessionLength-1
          && common.isEmptyArray(dataPool[i][conditionArg])){
          console.log('jumpCondition dataPool>>>', dataPool[i])
          jumpValue = step + parseInt(jumpLocation);
        }else if(common.isEmptyObj(dataPool[i][conditionArg])){
          jumpValue = step + parseInt(jumpLocation);
        }
        break;
    }
  }

  let pushResult2;
  let nextStep = step + 1;
  if(jumpValue != null){
    nextStep = jumpValue;
  }

  if(nextStep>=conf.queueConfig[taskName].length){
    await deleteTask({
      redisConn: redisConn,
      md5Value: dataPool[i].md5Value
    });
    triggerEvent(successEventName);
    return;
  }

  if(subMession === undefined){
    console.log('nextStep:', nextStep);
    console.log('taskName:', taskName);
    console.log(JSON.stringify(dataPool[i]));
    pushResult2 = await redisConn.lpush(conf.queueConfig[taskName][nextStep].name, JSON.stringify(dataPool[i]));
  }else{
    const subMessionProcessName = `${subMession}Process`;
    if(dataPool[i][subMessionProcessName]===undefined){
      dataPool[i][subMessionProcessName] = 0;
    }
    dataPool[i][subMessionProcessName]++;
    if(subMessionIndex == subMessionLength-1){
      if(dataPool[i][subMessionProcessName] >= dataPool[i][subMession].length){
        console.log('nextStep:', nextStep);
        console.log('taskName:', taskName);
        console.log(JSON.stringify(dataPool[i]));
        pushResult2 = await redisConn.lpush(conf.queueConfig[taskName][nextStep].name, JSON.stringify(dataPool[i]));
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
  let promiseListSubs = [];
  const dataPool = [];
  const taskFunctin = certObj[funcName] || policyObj[funcName] || thingObj[funcName];
  const subMession = conf.queueConfig[taskName][step]['subMession'];
  taskStepStatus[taskName][step] = true;

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
      promiseList.push(taskFunctin(...drawDataArgs));
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
            }else if(subMessionKey == 'object'){
              const objKeys= element.split(':').splice(2,);
              const objValue = objKeys.map((item)=>{
                return objData[subMession][j][item];
              });
              drawDataArgs.push(...objValue);
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
    console.log('promiseListSubs>>>', promiseListSubs);
    promiseListSubs = promiseListSubs.map((a)=>{return Promise.all(a);});
    console.log('promiseListSubs2>>>', promiseListSubs)
    const promiseListSubsResult = await Promise.all(promiseListSubs);
    for(let i=0;i<promiseListSubsResult.length;i++){
      const subResultElement = promiseListSubsResult[i];
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
      attachPolicy:               awsIotAgent.limit.AttachPolicy,
      attachThingPrincipal:       awsIotAgent.limit.AttachThingPrincipal,
      attachPrincipalPolicy:      awsIotAgent.limit.AttachPrincipalPolicy,
      createPolicy:               awsIotAgent.limit.CreatePolicy,
      detachPrincipalPolicy:      awsIotAgent.limit.DetachPrincipalPolicy,
      deleteCertificate:          awsIotAgent.limit.DeleteCertificate,
      detachThingPrincipal:       awsIotAgent.limit.DetachThingPrincipal,
      detachPolicy:               awsIotAgent.limit.DetachPolicy,
      deletePolicy:               awsIotAgent.limit.DeletePolicy,
      registerCertificate:        awsIotAgent.limit.RegisterCertificate,
      listAttachedPolicies:       awsIotAgent.limit.ListAttachedPolicies,
      listTargetsForPolicy:       awsIotAgent.limit.ListTargetsForPolicy,
      updateCertificate:          awsIotAgent.limit.UpdateCertificate,
    };
}

function runConfigTask(args){
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
        try{
          sendTask({
            step: step,
            redisConn: args.redisConn,
            certObj: args.certObj,
            policyObj: args.policyObj,
            thingObj: args.thingObj,
            taskName: taskName
          });
        }catch(error){
          logger.loggerError.info('sendTaskErr>>>', error.stack);
          taskStepStatus[taskName][step] = false;
        }
      }
    }
  }
}

let taskEngine;
function startTask(){
  if(taskEngine === undefined){
    const redisConn = new redisCli();
    const certObj = new awsIotAgent.CertAgent();
    const policyObj = new awsIotAgent.PolicyAgent();
    const thingObj = new awsIotAgent.ThingAgent();
    taskEngine = setInterval(()=>{
      runConfigTask({
        redisConn: redisConn,
        certObj: certObj,
        policyObj: policyObj,
        thingObj: thingObj
      });
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
