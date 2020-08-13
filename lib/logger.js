'use strict';
const log4js = require('log4js');
const conf = require('../conf.js');

log4js.addLayout('json', function() {
  return function(logEvent) {
    const customLogType = {
      startTime: logEvent.startTime,
      data: logEvent.data[0]
    }
    return JSON.stringify(customLogType);
    }
});

log4js.configure({
  appenders: {
    infoFile: {
      type: 'file',
      filename: conf.infoLogPath,
      layout: { type: 'json' }
    },
    errorFile: {
      type: 'file',
      filename: conf.errLogPath,
      layout: { type: 'json' }
    },
    debug: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['infoFile'], level: 'info' },
    info: { appenders: ['infoFile'], level: 'info' },
    error: { appenders: ['errorFile'], level: 'info'},
    debug: { appenders: ['debug'], level: 'info' },
  }
});

let loggerInfo = log4js.getLogger('info');
let loggerError = log4js.getLogger('error');

if(conf.debug){
  loggerInfo = log4js.getLogger('debug');
  loggerError = log4js.getLogger('debug');
}

module.exports = {
  loggerInfo: loggerInfo,
  loggerError: loggerError
}
