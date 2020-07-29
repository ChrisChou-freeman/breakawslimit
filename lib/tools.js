const conf = require('../conf');
const crypto = require('crypto');

exports.countingTime = function(obj, action, step) {
    if(!conf.debug) return;
    if(action == 'in') obj.startTime = new Date().getTime();
    else if(action == 'out'){
        obj.spendTime = new Date().getTime() - obj.startTime;
        console.log(obj.op + '--step' + step + 'spend time:' + obj.spendTime);
    }
}


exports.genMd5 = function(data) {
    var Hash = crypto.createHash('md5');
    Hash.update(data);
    return Hash.digest('hex');
}

