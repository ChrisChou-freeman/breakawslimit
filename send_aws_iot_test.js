const policyManage = require('./src/aws_iot_agent/policy_agent.js');



const policyObj = new policyManage();

policyObj.listTargetsForPolicy('testpolicy')
  .then((data)=>{
    console.log(data);
  });

