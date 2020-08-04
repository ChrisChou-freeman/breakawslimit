'use strict';
const fs = require('fs');

const tools = require('./tools');

async function createCert(client){
  const deviceCert = await tools.genDeviceCert();
  const policies = tools.genPolicy(5);
  const requestData = {
    ca: fs.readFileSync(__dirname + '/caroot/rootCA.pem').toString(),
    certificate: deviceCert,
    thingName: 'test_thing_chris',
    policyName: 'test_policy_chris',
    policies: policies
  };
  client.createCert({data: JSON.stringify(requestData)}, (err, response)=>{
    if(err){
      console.error('createCertErr>>', err.stack);
      return;
    }
    console.log('createCertResponse>>', response);
  });
}

module.exports = createCert;
