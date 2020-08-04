const policyManage = require('../src/aws_iot_agent/policy_agent.js');



const policyObj = new policyManage();

// policyObj.listTargetsForPolicy('test_policy_chris4')
//   .then((data)=>{
//     console.log(data);
//   });

policyObj.listAttachedPolicies('arn:aws:iot:us-west-2:222294582284:cert/c4b4e173200e1057d7537c80a1cd83aa93fb03787aa926b409f45ab7bf0719d1')
  .then((data)=>{
    console.log(JSON.stringify(data));
  });

