const redisAgent = require('../lib/redis');
const conf = require('../conf');

async function cleanReids(){
  const redisCli = new redisAgent();
  await redisCli.connect();
  for(let key in conf.queueConfig){
    const value = conf.queueConfig[key];
    if(typeof value == 'string'){
      const delResutl = await redisCli.del(value);
      console.log(delResutl);
    }else{
      for(let i=0;i<value.length;i++){
        const obj = value[i];
        const delResult = await redisCli.del(obj.name);
        console.log(delResult);
      }
    }
  }
  process.exit(1);
}

cleanReids();
