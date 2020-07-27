'use strict';
exports.debug = true;
const logRoot = __dirname;
exports.infoLogPath = logRoot + '/log/info.log';
exports.errLogPath = logRoot + '/log/err.log';
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
    4: 'cc_detachPolicy',
    5: 'cc_deletePolicy',
    6: 'cc_createPolicy',
    7: 'cc_attachPolicy',
  },
  UpdatCertificateQueue:      {
    1: 'uc_listAttachedPolicies',
    2: 'uc_detachPolicy',
    3: 'uc_deletePolicy',
    4: 'uc_listTargetsForPolicy',
    5: 'uc_detachPolicy',
    6: 'uc_deletePolicy',
    7: 'uc_createPolicy',
    8: 'uc_attachPolicy',
  },
  RevokeCertificateQueue:     {
    1: 'rc_detachThingPrincipal',
    2: 'rc_listTargetsForPolicy',
    3: 'rc_detachPolicy',
    4: 'rc_deletePolicy',
    5: 'rc_deleteCertificate'
  }
}
