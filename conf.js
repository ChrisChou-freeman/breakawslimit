'use strict';
exports.debug = true;
const logRoot = __dirname;
exports.infoLogPath = logRoot + '/log/info.log';
exports.errLogPath = logRoot + '/log/err.log';
exports.protosPath = __dirname + '/protos/limit_server_buffer.proto';

exports.redis= {
  redisHost: '127.0.0.1',
  redisPort: '6379',
};

exports.queueConfig= {
  redisMainTaskSet: 'redisMainTaskSet',

  CreateCertificateQueue:     [
    {
      name: 'cc_registerCertificate',
      drawData: ['certificate', 'ca'],
      putArgs: ['certificateArn']
    },
    {
      name: 'cc_attachThingPrincipal',
      drawData: ['certificateArn', 'thingName'],
      putArgs: []
    },
    {
      name: 'cc_listTargetsForPolicy',
      drawData: ['addtion:index:policyName'],
      putArgs: ['subMession:targets:targets'],
      subMession: 'policies',
      jumpCondition: 'targets:Empty:2',
    },
    {
      name: 'cc_detachPolicy',
      drawData: ['subMession:object:target:policyName'],
      putArgs: [],
      subMession: 'targets',
    },
    {
      name: 'cc_deletePolicy',
      drawData: ['addtion:index:policyName'],
      putArgs: [],
      subMession: 'policies',
    },
    {
      name: 'cc_createPolicy',
      drawData: ['addtion:index:policyName', 'subMession:index'],
      putArgs: ['subMession:policyName:policyNames'],
      subMession: 'policies',
    },
    {
      name: 'cc_attachPolicy',
      drawData: ['subMession:index', 'certificateArn'],
      putArgs: [],
      subMession: 'policyNames',
    },
  ],

  UpdatCertificateQueue:      [
    {
      name: 'uc_listAttachedPolicies',
      drawData: ['certificateArn'],
      putArgs: ['attachedPolicies'],
      jumpCondition: 'attachedPolicies:Empty:3'
    },
    {
      name: 'uc_detachPolicy',
      drawData: ['subMession:object:target:policyName'],
      putArgs: [],
      subMession: 'attachedPolicies'
    },
    {
      name: 'uc_deletePolicy',
      drawData: ['subMession:object:policyName'],
      putArgs: [],
      subMession: 'attachedPolicies'
    },
    {
      name: 'uc_listTargetsForPolicy',
      drawData: ['addtion:index:policyName'],
      putArgs: ['subMession:targets:targets'],
      subMession: 'policies',
      jumpCondition: 'targets:Empty:2',
    },
    {
      name: 'uc_detachPolicy',
      drawData: ['subMession:object:target:policyName'],
      putArgs: [],
      subMession: 'targets',
    },
    {
      name: 'uc_deletePolicy',
      drawData: ['addtion:index:policyName'],
      putArgs: [],
      subMession: 'policies',
    },
    {
      name: 'uc_createPolicy',
      drawData: ['addtion:index:policyName', 'subMession:index'],
      putArgs: ['subMession:policyName:policyNames'],
      subMession: 'policies',
    },
    {
      name: 'uc_attachPolicy',
      drawData: ['subMession:index', 'certificateArn'],
      putArgs: [],
      subMession: 'policyNames',
    },
  ],

  RevokeCertificateQueue:     [
    {
      name: 'rc_detachThingPrincipal',
      drawData: ['certificateArn', 'thingName'],
      putArgs: [],
    },
    {
      name: 'rc_listAttachedPolicies',
      drawData: ['certificateArn'],
      putArgs: ['attachedPolicies'],
      jumpCondition: 'attachedPolicies:Empty:3'
    },
    {
      name: 'rc_detachPolicy',
      drawData: ['subMession:object:target:policyName'],
      putArgs: [],
      subMession: 'attachedPolicies'
    },
    {
      name: 'rc_deletePolicy',
      drawData: ['subMession:object:policyName'],
      putArgs: [],
      subMession: 'attachedPolicies'
    },
    {
      name: 'rc_updateCertificate',
      drawData: ['certificateArn'],
      putArgs: [],
    },
    {
      name: 'rc_deleteCertificate',
      drawData: ['certificateArn'],
      putArgs: []
    },
  ]
};
