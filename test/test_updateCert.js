'use strict';
const tools = require('./tools');

const certArn = 'arn:aws:iot:us-west-2:222294582284:cert/27488aecd1a4245d5b201473cd3c8853e02bc3e291771e55e2b3daeff221b21d';

async function updateCert(client){
  const policies = tools.genPolicy(6);
  const requestData = {
    certificateArn: certArn,
    policyName: 'test_policy_update_chris',
    policies: policies
  };
  client.updateCert({data: JSON.stringify(requestData)}, (err, response)=>{
    if(err){
      console.error('updateCertErr>>', err.stack);
      return;
    }
    console.log('updateCertResponse>>', response);
  });
}

module.exports = updateCert;
