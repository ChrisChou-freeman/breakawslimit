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
    info: {
      type: 'file',
      filename: conf.infoLogPath,
      layout: { type: 'json' }
    },
    error: {
      type: 'file',
      filename: conf.errLogPath,
      layout: { type: 'json' }
    },
    debug: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['info'], level: 'info' },
    info: { appenders: ['info'], level: 'info' },
    error: { appenders: ['error'], level: 'info'},
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
