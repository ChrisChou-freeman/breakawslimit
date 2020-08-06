'use strict';
const thingName = 'test_thing_chris';

async function revokeCert(client, certArn){
  const requestData = {
    certificateArn: certArn,
    thingName: thingName,
  };
  client.revokeCert({data: JSON.stringify(requestData)}, (err, response)=>{
    if(err){
      console.error('updateCertErr>>', err.stack);
      return;
    }
    console.log('updateCertResponse>>', response);
  });
}

module.exports = revokeCert;
