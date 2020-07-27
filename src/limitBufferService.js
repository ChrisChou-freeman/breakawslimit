'use strict';
const awsLimit = require('./aws_iot_agent/limit.js');

const ActionValue = {
  AttachPolicy:               awsLimit.AttachPolicy,
  AttachThingPrincipal:       awsLimit.AttachThingPrincipal,
  AttachPrincipalPolicy:      awsLimit.AttachPrincipalPolicy,
  CreatePolicy:               awsLimit.CreatePolicy,
  DetachPrincipalPolicy:      awsLimit.DetachPrincipalPolicy,
  DeleteCertificate:          awsLimit.DeleteCertificate,
  DetachCertificate:          awsLimit.DetachThingPrincipal,
  DetachPolicy:               awsLimit.DetachPolicy,
  DeletePolicy:               awsLimit.DeletePolicy,
  RegisterCertificate:        awsLimit.RegisterCertificate,
  ListAttachedPolicies:       awsLimit.ListAttachedPolicies,
  ListTargetsForPolicy:       awsLimit.ListTargetsForPolicy,
  UpdateCertificate:          awsLimit.UpdateCertificate,
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
