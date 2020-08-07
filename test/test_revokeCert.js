'use strict';
const thingName = 'test_thing_chris';

async function sendRquest(client, data){
  return new Promise((resolve)=>{
    const returnData = {error: null, data: null};
    client.revokeCert(data, (err, response)=>{
      if(err){
        console.error('createCertErr>>', err.stack);
        returnData.error = err;
        resolve(returnData);
        return;
      }
      console.log('revokeCertResponse>>', response);
      returnData.data = response;
      resolve(returnData);
      return;
    });
  });
}

async function revokeCert(client, certArn){
  const requestData = {
    certificateArn: certArn,
    thingName: thingName,
  };
  const data = {data: JSON.stringify(requestData)};
  const response = await sendRquest(client, data);
  return response;
}

module.exports = revokeCert;
