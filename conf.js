'use strict';
exports.debug = true;
exports.infoLogPath = './log/info.log';
exports.errLogPath = './log/err.log';
exports.protosPath = __dirname + '/protos/limit_server_buffer.proto';
exports.redis = {
  redisHost: '',
  redisPort: ''
};
exports.redis= {
  redisHost:                  '127.0.0.1',
  redisPort:                  '6379',
  redisMainTaskSet:           'redisMainTaskSet',
  redisMainTaskQueue:         'redisMainTaskQueue',
  CreateCertificateQueue:     {
    1: 'cc_registerCertificate',
    2: 'cc_attachThingPrincipal',
    3: 'cc_listTargetsForPolicy',
    6: 'cc_createPolicy',
    7: 'cc_attachPolicy',
  },
  UpdatCertificateQueue:      {
    1: 'uc_listAttachedPolicies',
    2: 'uc_detachPolicy',
    3: 'uc_deletePolicy',
    4: 'uc_createPolicy',
    5: 'uc_attachPolicy',
  },
  RevokeCertificateQueue:     {
    1: 'rc_listAttachedPolicies',
    2: 'RevokeCerDetachPrincipalPolicy',
    3: 'RevokeCerDeletePolicy',
    4: 'RevokeCerUpdateCertificate',
  }
}
