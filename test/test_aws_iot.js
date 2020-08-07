const policyManage = require('../src/aws_iot_agent/policy_agent.js');
const awsIotAgent = require('../src/aws_iot_agent');

const policyObj = new policyManage();
const thingObj = new awsIotAgent.ThingAgent();

// policyObj.listTargetsForPolicy('test_policy_chris4')
//   .then((data)=>{
//     console.log(data);
//   });

// policyObj.listAttachedPolicies('arn:aws:iot:us-west-2:222294582284:cert/c4b4e173200e1057d7537c80a1cd83aa93fb03787aa926b409f45ab7bf0719d1')
//   .then((data)=>{
//     console.log(JSON.stringify(data));
//   });

// policyObj.deletePolicy('asdfsfa')
//   .then((data)=>{
//     console.log(data);
//   });
//


policyObj.detachPolicy('arn:aws:iot:us-west-2:222294582284:cert/47a15550023d92f7afd7c073186e8ca120d40d3194bd6c7f33842c4bf1500f02', 'test_policy_chris15' )
  .then((data)=>{
    console.log(data);
  })

// thingObj.listThingPrincipals('test_thing_chris')
//   .then((data)=>{
//     console.log(data);
//   });
