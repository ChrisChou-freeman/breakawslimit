'use strict';
const CertAgent = require('./cert_agent.js');
const PolicyAgent = require('./policy_agent.js');
const ThingAgent = require('./thing_agent');
const limit = require('./limit_test');
// production
// const limit = require('./limit');

module.exports = {
  CertAgent,
  PolicyAgent,
  ThingAgent,
  limit
}
