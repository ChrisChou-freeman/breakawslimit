'use strict';
const tools = require('./tools');

const certArn = 'arn:aws:iot:us-west-2:222294582284:cert/27488aecd1a4245d5b201473cd3c8853e02bc3e291771e55e2b3daeff221b21d';

async function sendRquest(client, data){
  return new Promise((resolve)=>{
    const returnData = {error: null, data: null};
    client.updateCert(data, (err, response)=>{
      if(err){
        console.error('createCertErr>>', err.stack);
        returnData.error = err;
        resolve(returnData);
        return;
      }
      console.log('updateCertResponse>>', response);
      returnData.data = response;
      resolve(returnData);
      return;
    });
  });
}

async function updateCert(client){
  const policies = tools.genPolicy(6);
  const requestData = {
    certificateArn: certArn,
    policyName: 'test_policy_update_chris',
    policies: policies
  };
  const data = {data: JSON.stringify(requestData)};
  const response = await sendRquest(client, data);
  return response;
}

module.exports = updateCert;
