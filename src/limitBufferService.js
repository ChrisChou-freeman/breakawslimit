'use strict';
const awsLimit = require('./aws_iot_agent/limit.js');
const conf = require('../conf.js');

let ActionValue = {
  attachPolicy:               awsLimit.AttachPolicy,
  attachThingPrincipal:       awsLimit.AttachThingPrincipal,
  attachPrincipalPolicy:      awsLimit.AttachPrincipalPolicy,
  createPolicy:               awsLimit.CreatePolicy,
  detachPrincipalPolicy:      awsLimit.DetachPrincipalPolicy,
  deleteCertificate:          awsLimit.DeleteCertificate,
  detachThingPrincipal:       awsLimit.DetachThingPrincipal,
  detachPolicy:               awsLimit.DetachPolicy,
  deletePolicy:               awsLimit.DeletePolicy,
  registerCertificate:        awsLimit.RegisterCertificate,
  listAttachedPolicies:       awsLimit.ListAttachedPolicies,
  listTargetsForPolicy:       awsLimit.ListTargetsForPolicy,
  updateCertificate:          awsLimit.UpdateCertificate,
}

/**
 * TODO list
	registerCertificate
	attachThingPrincipal
	listTargetsForPolicy(列出所有绑定当前)
		detachPolicy (for)
	  deletePolicy(for)
	createPolicy(for)
	attachPolicy(for)
  */
/* recieve data form
  {
    ca: "",
    certificate: "",
    thingName: "",
    needAttachPolicy: true/false,
    prefixOfpolicyName: "xxx",
    policies: [
        {...},
        {...},
    ],
  }
*/
function createCert(req, callback){
  const data = JSON.parse(req.request.data);
  console.log(data);
  callback(null, {response: req.request.data});
}

/**
 * TODO list
  listAttachedPolicies  // list cert attached policies
  detachPolicy(for) //  detach attached policies
  deletePolicy(for)  // delete detached policies
  listTargetsForPolicy // list Policy attached target
	  detachPolicy (for)
	  deletePolicy(for)
	createPolicy(for)
	attachPolicy(for)
  */
/* recieve data form
  {
    certificateARN: "xxx",
    prefixOfpolicyName: "xxx",
    policies: [
        {...},
        {...},
    ]
  }
*/
function updateCert(req, callback){
  const data = JSON.parse(req.request.data);
  console.log(data);
  callback(null, {response: req.request.data});
}

/**
 * TODO list
  detachThingPrincipal
  listTargetsForPolicy
    detachPolicy
    deletePolicy
  updateCertificate
  deleteCertificate
  */
/* recieve data form
  {
    certificateARN: "xxx",
  }
*/
function revokeCert(req, callback){
  const data = JSON.parse(req.request.data);
  console.log(data);
  callback(null, {response: req.request.data});
}

module.exports = {
  createCert,
  updateCert,
  revokeCert
}
