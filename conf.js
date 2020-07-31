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
      drawData: ['policyName'],
      putArgs: ['targets']
    },
    {
      name: 'cc_detachPolicy',
      drawData: ['policyName', 'subMession:index'],
      putArgs: [],
      subMession: 'targets',
    },
    {
      name: 'cc_deletePolicy',
      drawData: ['policyName'],
      putArgs: [],
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

  // UpdatCertificateQueue:      [
  //   {
  //     name: 'uc_listAttachedPolicies',
  //   },
  //   {
  //     name: 'uc_detachPolicy',
  //   },
  //   {
  //     name: 'uc_deletePolicy',
  //   },
  //   {
  //     name: 'uc_listTargetsForPolicy',
  //   },
  //   {
  //     name: 'uc_detachPolicy',
  //   },
  //   {
  //     name: 'uc_deletePolicy',
  //   },
  //   {
  //     name: 'uc_createPolicy',
  //   },
  //   {
  //     name: 'uc_attachPolicy',
  //   },
  // ],

  // RevokeCertificateQueue:     {
  //   1: 'rc_detachThingPrincipal',
  //   2: 'rc_listTargetsForPolicy',
  //   3: 'rc_detachPolicy',
  //   4: 'rc_deletePolicy',
  //   5: 'rc_deleteCertificate',
  // }
};
