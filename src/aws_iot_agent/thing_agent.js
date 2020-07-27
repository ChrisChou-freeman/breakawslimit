'use strict';
const AWS = require('aws-sdk');

const common = require('../../lib/common.js');
const logger = require('../../lib/logger.js');

AWS.config.loadFromPath( './config.json');

const iot = new AWS.Iot();
