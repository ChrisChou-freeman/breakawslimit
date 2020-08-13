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
  const {redisConn, md5Value} = args;
  const returnData = {error: null, data: false};
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
  const {md5Value, redisConn} = args;
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
  const {queName, redisConn} = args;
  const connectResult = await redisConn.connect();
  if(connectResult.error){
    returnData.error = connectResult.error;
    return returnData;
  }

  const result = await redisConn.rpop(queName);
  if(result.error){
    logger.loggerError.info('popQueueItemErr>>>', result.error.stack);
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
    certificateArn: "xxx",
    thingName: "xxx"
  }
*/
async function revokeCert(req, callback){
  const responseData = {status: false, info: ''};
  const requestData = JSON.parse(req.request.data);
  console.log('start revokeCert>>>');
  if(common.isEmptyString(requestData.certificateArn)
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
    redisConn.lpush(conf.queueConfig.RevokeCertificateQueue[0].name, jsonData),
    redisConn.sadd(conf.queueConfig.redisMainTaskSet, md5Value)
  ]);
  const pushResult = resultList[0];
  const addResult = resultList[1];
  if(pushResult.error){
    responseData.info = '503';
    logger.loggerError.info('RevokeCertificateQueueLpushErr>>', pushResult.error.stack);
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }
  if(addResult.error){
    responseData.info = '503';
    logger.loggerError.info('RevokeCertificateQueueSaddErr>>', addResult.error.stack);
    callback(null, {response: JSON.stringify(responseData)});
    return;
  }

  registerEvent(md5Value, callback);
}

async function handelResult(args){
  let step = args.step;
  let jumpValue = null;
  const {
    taskName,
    currentQueueName,
    dataResult,
    dataPool,
    redisConn,
    resultIndex,
    putArgs,
    subMessionIndex,
    subMessionLength,
  } = args;
  const errorEvnentName  = dataPool[resultIndex].md5Value + '_Error';
  const successEventName = dataPool[resultIndex].md5Value + '_Success';
  const subMession = conf.queueConfig[taskName][step]['subMession'];
  const jumpCondition = conf.queueConfig[taskName][step]['jumpCondition'];

  console.log(`step:${step} dataResult>>>`, dataResult.error);

  if(dataResult.error){
    if(dataPool[resultIndex].errTime === undefined){
      dataPool[resultIndex].errTime = 0;
    }
    if(dataPool[resultIndex].errTime >= conf.TASK_ERROR_TIME_LIMIT){
      await deleteTask({
        redisConn: redisConn,
        md5Value: dataPool[resultIndex].md5Value
      });
      triggerEvent(errorEvnentName);
      return;
    }
    dataPool[resultIndex].errTime++;
    const pushResult = await redisConn.lpush(currentQueueName, JSON.stringify(dataPool[resultIndex]));
    if(pushResult.error){
      logger.loggerError.info(`${currentQueueName} Step${step} Err>>`, pushResult.error.stack);
      await deleteTask({
        redisConn: redisConn,
        md5Value: dataPool[resultIndex].md5Value
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
        const argName = element.split(':')[1];
        const argsAliaName = element.split(':')[2];
        if(dataPool[resultIndex][argsAliaName] == undefined){
          dataPool[resultIndex][argsAliaName] = [];
        }
        if(util.isArray(dataResult.data[argName])){
          for(let j=0;j<dataResult.data[argName].length;j++){
            let element2 = dataResult.data[argName][j];
            dataPool[resultIndex][argsAliaName].push(element2);
          }
        }else{
          const pushData = dataResult.data[argName];
          dataPool[resultIndex][argsAliaName].push(pushData);
        }
      }else{
        dataPool[resultIndex][element] = dataResult.data[element];
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
          && common.isEmptyArray(dataPool[resultIndex][conditionArg])){
          console.log('need jumpCondition ');
          jumpValue = step + parseInt(jumpLocation);
        }else if(common.isEmptyObj(dataPool[resultIndex][conditionArg])
          || common.isEmptyArray(dataPool[resultIndex][conditionArg])){
          jumpValue = step + parseInt(jumpLocation);
          console.log('need jumpCondition ');
        }
        break;
    }
  }

  let nextStep = step + 1;
  if(jumpValue != null){
    nextStep = jumpValue;
  }

  let subMessionProcessName;
  if(subMession){
    subMessionProcessName = `${subMession}Process`;
    if(dataPool[resultIndex][subMessionProcessName]===undefined){
      dataPool[resultIndex][subMessionProcessName] = 0;
    }
    dataPool[resultIndex][subMessionProcessName] += 1;
  }

  if(nextStep>=conf.queueConfig[taskName].length){
    if(subMession){
      if(dataPool[resultIndex][subMessionProcessName] >= dataPool[resultIndex][subMession].length){
        await deleteTask({
          redisConn: redisConn,
          md5Value: dataPool[resultIndex].md5Value
        });
        triggerEvent(successEventName);
        return;
      }
    }else{
      await deleteTask({
        redisConn: redisConn,
        md5Value: dataPool[resultIndex].md5Value
      });
      triggerEvent(successEventName);
      return;
    }
  }

  let pushResult2;
  if(subMession === undefined){
    console.log('nextStep:', nextStep);
    console.log('taskName:', taskName);
    console.log('dataPool:', JSON.stringify(dataPool[resultIndex]));
    pushResult2 = await redisConn.lpush(conf.queueConfig[taskName][nextStep].name, JSON.stringify(dataPool[resultIndex]));
  }else{
    if(subMessionIndex == subMessionLength-1){
      if(dataPool[resultIndex][subMessionProcessName] >= dataPool[resultIndex][subMession].length){
        console.log('nextStep:', nextStep);
        console.log('taskName:', taskName);
        console.log('dataPool:', JSON.stringify(dataPool[resultIndex]));
        dataPool[resultIndex][subMessionProcessName] = 0;
        pushResult2 = await redisConn.lpush(conf.queueConfig[taskName][nextStep].name, JSON.stringify(dataPool[resultIndex]));
      }else{
        pushResult2 = await redisConn.lpush(currentQueueName, JSON.stringify(dataPool[resultIndex]));
      }
    }
  }

  if(pushResult2 != undefined && pushResult2.error){
    logger.loggerError.info(`${currentQueueName} Step${step} Err2>>`, pushResult2.error.stack);
    await deleteTask({
      redisConn: redisConn,
      md5Value: dataPool[resultIndex].md5Value
    });
    triggerEvent(errorEvnentName);
    return;
  }
}

async function sendTask(args){
  const {
    step,
    redisConn,
    certObj,
    policyObj,
    thingObj,
    taskName,
  } = args;
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
    const jsonData = await popQueueItem({
      queName: currentQueueName,
      redisConn: redisConn
    });
    if(jsonData.data == null){
      continue;
    }
    const objData = JSON.parse(jsonData.data);

    dataPool.push(objData);

    if(subMession === undefined){
      ActionValue[funcName]--;
      if(ActionValue[funcName] < 0){
        // put back
        await redisConn.lpush(currentQueueName, jsonData.data);
        break;
      }
      const drawData = conf.queueConfig[taskName][step]['drawData'];
      const drawDataArgs = [];
      for(let j=0;j<drawData.length;j++){
        drawDataArgs.push(objData[drawData[j]]);
      }
      promiseList.push(taskFunctin(...drawDataArgs));
    }else{
      const subPromiseList = [];
      const drawData = conf.queueConfig[taskName][step]['drawData'];
      for(let j=0;j<objData[subMession].length;j++){
        const subMessionProcessName = `${subMession}Process`;
        if(objData[subMessionProcessName] != undefined
          && j < objData[subMessionProcessName] ){
          continue;
        }
        ActionValue[funcName]--;
        if(ActionValue[funcName] < 0){
          if(j==0
            || j==objData[subMessionProcessName]){
            // put back
            await redisConn.lpush(currentQueueName, jsonData.data);
          }
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
    promiseListSubs = promiseListSubs.map((a)=>{return Promise.all(a);});
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
  const {
    redisConn,
    certObj,
    policyObj,
    thingObj,
  } = args;
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
            redisConn,
            certObj,
            policyObj,
            thingObj,
            step: step,
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
    }, 10);

    setInterval(resetAvtionValue, 1000);
  }
}

module.exports = {
  createCert,
  updateCert,
  revokeCert,
  startTask
}
