// How to use AsyncLocalStorage in Node.js
import http from 'node:http';
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

function logWithId(msg) {
  const traceId = asyncLocalStorage.getStore();
  console.log(`${traceId}:`, msg);
}

let traceId = 0;
http.createServer((req, res) => {

  //执行异步操作并传入ID
  asyncLocalStorage.run(traceId++, () => {
    //记录开始
    logWithId('start');
    // Imagine any chain of async operations here
    setImmediate(() => {
      //记录结束
      logWithId('finish');
      res.end();
    });
  });
}).listen(8080);

http.get('http://localhost:8080');
http.get('http://localhost:8080');

// Prints:
//   0: start
//   1: start
//   0: finish
//   1: finish
