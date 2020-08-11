'use strict';
const fs = require('fs');

const tools = require('./tools');
const clientManage = require('./test_client');
const awsIotAgent = require('../src/aws_iot_agent');

const thingName = 'test_thing_chris';

async function testCreateCert(policyName){
  const clientObj = new clientManage();
  const deviceCert = await tools.genDeviceCert();
  const policies = tools.genPolicy(6);
  const requestData = {
    thingName,
    ca: fs.readFileSync(__dirname + '/caroot/rootCA.pem').toString(),
    certificate: deviceCert,
    policyName: policyName,
    policies: policies
  };
  return clientObj.createCert(requestData);
}

async function testRevokeCert(certArn){
  const clientObj = new clientManage();
  const requestData = {
    thingName,
    certificateArn: certArn,
  };
  return clientObj.revokeCert(requestData);
}

async function testUpdateCert(args){
  const {
    certificateArn,
    policyName
  } = args;
  const policies = tools.genPolicy(6);
  const clientObj = new clientManage();
  return clientObj.updateCert({
    certificateArn,
    policyName,
    policies
  });
}

async function main(){
  // const resultList = await Promise.all([
  //   testCreateCert('test_chris_policy1'),
  //   testCreateCert('test_chris_policy2'),
  // ]);
  // console.log(resultList);
  const thingObj = new awsIotAgent.ThingAgent();
  const attachedCerts = await thingObj.listThingPrincipals('test_thing_chris');
  const certlist = attachedCerts.data.principals;
  if(certlist == []){
    return;
  }
  // const promiseList2 = [];
  // for(let i=0;i<certlist.length;i++){
  //   const policyName = 'test_chris_update_policy' + i;
  //   const cert = certlist[i];
  //   promiseList2.push(
  //     testUpdateCert({
  //       policyName,
  //       certificateArn: cert
  //     })
  //   );
  // }

  // const resultList2 = await Promise.all(promiseList2);
  // console.log(resultList2);

  const promiseList3 = [];
  for(let i=0;i<certlist.length;i++){
    const cert = certlist[i];
    promiseList3.push(testRevokeCert(cert));
  }
  const resultList3 = await Promise.all(promiseList3);
  console.log(resultList3);
}

main();
