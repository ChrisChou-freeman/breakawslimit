'use strict';
const fs = require('fs');

const tools = require('./tools');

async function sendRquest(client, data){
  return new Promise((resolve)=>{
    const returnData = {error: null, data: null};
    client.createCert(data, (err, response)=>{
      if(err){
        console.error('createCertErr>>', err.stack);
        returnData.error = err;
        resolve(returnData);
        return;
      }
      console.log('createCertResponse>>', response);
      returnData.data = response;
      resolve(returnData);
      return;
    });
  });
}

async function createCert(client, policyName='test_thing_chris', policyNumber=5){
  const deviceCert = await tools.genDeviceCert();
  const policies = tools.genPolicy(policyNumber);
  const requestData = {
    ca: fs.readFileSync(__dirname + '/caroot/rootCA.pem').toString(),
    certificate: deviceCert,
    thingName: 'test_thing_chris',
    policyName: policyName,
    policies: policies
  };
  const response = await sendRquest(client, {data: JSON.stringify(requestData)})
  return response;
}

module.exports = createCert;
