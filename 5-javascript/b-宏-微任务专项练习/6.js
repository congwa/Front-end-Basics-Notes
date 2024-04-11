// 第六天

const LazyMan = function (name) {
  console.log(`Hi i am ${name}`);
  function _eat(food) {
    console.log(`I am eating ${food}`);
  }
  const callbacks = [];
  class F {
    sleep(timeout) {
      setTimeout(function () {
        console.log(`等待了${timeout}秒...`);
        callbacks.forEach((cb) => cb());
      }, timeout);
      return this;
    }
    eat(food) {
      callbacks.push(_eat.bind(null, food));
      return this;
    }
  }
  return new F();
};

LazyMan('Tony').sleep(10).eat('lunch');

// Hi i am Tony

// 等待了10秒

// I am eating lunch
