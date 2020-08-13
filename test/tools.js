'use strict';
const util = require('util');
const fs = require('fs');
const {execSync} = require('child_process');

const CA_CERT = __dirname + '/caroot/rootCA.pem';
const CA_KEY = __dirname + '/caroot/rootCA.key';
const DEVICE_KEY_PATH = __dirname + '/temp/';

function genDeviceCert(){
  var date = new Date();
  var FullDateTime = util.format(
      '%s-%s-%s-%s',
      date.getFullYear(),
      date.getMonth()+1,
      date.getDate(),
      date.getHours(),
  );
  var keyPath = DEVICE_KEY_PATH + FullDateTime;
  var exists = fs.existsSync(keyPath);
  if(!exists) fs.mkdirSync(keyPath);
  var times = date.getTime().toString()
  + Math.random().toString().split('.')[1].slice(0,7);
  var newKeypath = keyPath + '/' + times;
  var genKeycom = `openssl genrsa -out ${newKeypath}.key 2048`
  genKeycom += ` && openssl req -new -key ${newKeypath}.key -out ${newKeypath}.csr`
  genKeycom += ` -subj "/C=CN/ST=SZ/L=SZ/O=SG/OU=dev/CN=f728313ae2b4703c26e5d7bd12d34ee7ea5860ce092ba3b60b96d095bbcf7590/emailAddress=test@SG.com"`
  genKeycom += ` && openssl x509 -req -in ${newKeypath}.csr -CA ${CA_CERT} -CAkey ${CA_KEY} -CAcreateserial -out ${newKeypath}.pem -days 500 -sha256`;
  execSync(genKeycom);
  return fs.readFileSync(newKeypath + '.pem').toString();
}

function genPolicy(policyNum){
    const policyArray = [];
    for(let i=0; i<policyNum; i++){
        const data = fs.readFileSync(__dirname + '/policy_template.json').toString();
        policyArray.push(data);
    }
    return policyArray;
}

module.exports = {
    genDeviceCert: genDeviceCert,
    genPolicy:     genPolicy,
}
