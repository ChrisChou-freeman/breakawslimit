'use strict';
const CertAgent = require('./cert_agent.js');
const PolicyAgent = require('./policy_agent.js');
const ThingAgent = require('./thing_agent');
const conf = require('../../conf');

let limit;
if(conf.debug){
  limit = require('./limit_test');
}else{
  limit = require('./limit');
}

module.exports = {
  CertAgent,
  PolicyAgent,
  ThingAgent,
  limit
}
