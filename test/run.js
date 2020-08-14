'use strict';
const fs = require('fs');

const tools = require('./tools');
const clientManage = require('./test_client');
const awsIotAgent = require('../lib/aws_iot_agent');

const thingName = 'test_thing_chris';

async function testCreateCert(policyName){
  const clientObj = new clientManage();
  const deviceCert = tools.genDeviceCert();
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
  const requestNumer = 5;
  const promiseList1 = [];
  for(let i=0;i<requestNumer;i++){
    const policyName = `test2_chris_policy${i}`;
    promiseList1.push(
      testCreateCert(policyName)
    );
  }
  const resultList1 = await Promise.all(promiseList1);
  console.log(resultList1)

  // const thingObj = new awsIotAgent.ThingAgent();
  // const attachedCerts = await thingObj.listThingPrincipals('test_thing_chris');
  // const certlist = attachedCerts.data.principals;
  // if(certlist == []){
  //   return;
  // }

  // const certlist2 = certlist.slice(0,5);
  // const promiseList2 = [];
  // for(let i=0;i<certlist2.length;i++){
  //   const policyName = 'test_update_policy' + i;
  //   const cert = certlist2[i];
  //   promiseList2.push(
  //     testUpdateCert({
  //       policyName,
  //       certificateArn: cert
  //     })
  //   );
  // }
  // const certlist3 = certlist.slice(5,);
  // const promiseList3 = [];
  // for(let i=0;i<certlist3.length;i++){
  //   const cert = certlist3[i];
  //   promiseList3.push(testRevokeCert(cert));
  // }
  // const resultList2 = await Promise.all(promiseList2);
  // const resultList3 = await Promise.all(promiseList3);
  // console.log(resultList2);
  // console.log(resultList3);
}

main();
