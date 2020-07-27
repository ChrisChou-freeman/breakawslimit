'use strict';
function main(req, callback){
  console.log('req>>>', req);
  const data = JSON.parse(req.request.data);
  callback(null, {response: req.request.data});
}

module.exports = {
  main
}
