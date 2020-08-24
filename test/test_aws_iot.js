const policyManage = require('../lib/aws_iot_agent/policy_agent.js');
const awsIotAgent = require('../lib/aws_iot_agent');

const policyObj = new policyManage();
const thingObj = new awsIotAgent.ThingAgent();

// policyObj.listTargetsForPolicy('test_policy_chris4')
//   .then((data)=>{
//     console.log(data);
//   });

// policyObj.listAttachedPolicies('arn:aws:iot:us-west-2:222294582284:cert/7d24c009c740504143e020894412f23c7a926de53cb993a3352b3d9b31af5c25')
//   .then((data)=>{
//     console.log(JSON.stringify(data));
//   });

// policyObj.deletePolicy('asdfsfa')
//   .then((data)=>{
//     console.log(data);
//   });
//

// policyObj.detachPolicy('arn:aws:iot:us-west-2:222294582284:cert/47a15550023d92f7afd7c073186e8ca120d40d3194bd6c7f33842c4bf1500f02', 'test_policy_chris15' )
//   .then((data)=>{
//     console.log(data);
//   })

thingObj.listThingPrincipals('test_thing_chris')
  .then((data)=>{
    // console.log(data);
    const principals = data.data.principals;
    console.log(principals);
    // for(let i=0;i<principals.length;i++){
    //   const element = principals[i];
    //   policyObj.listAttachedPolicies(element)
    //     .then((data)=>{
    //       console.log(JSON.stringify(data));
    //       console.log(data.data.attachedPolicies.length);
    //       console.log('-------------');
    //       console.log('-------------');
    //     })
    // }
  });
