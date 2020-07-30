function test1(){
  return new Promise((resolve)=>{
    resolve(1);
    return
  });
}
function test2(){
  return new Promise((resolve)=>{
    resolve(1);
    return
  });
}
function test3(){
  return new Promise((resolve)=>{
    resolve(1);
    return
  });
}

Promise.all([test1, null, test2, test3])
  .then((data)=>{
    console.log(data);
  });
