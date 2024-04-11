/**
 * 当我发送网络请求的时候，需要拿到这次网络请求的数据，再发送网络请求，就这样重复三次，才能拿到我最终的结果
 */

function requestData(url) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (url.includes("iceweb")) {
                resolve(url);
            } else {
                reject("请求错误");
            }
        }, 1000);
    });
}

/**
 * 不优雅写法1
 */
requestData("iceweb.io").then((res) => {
    requestData(`iceweb.org ${res}`).then((res) => {
        requestData(`iceweb.com ${res}`).then((res) => {
            console.log(res);
        });
    });
});

//iceweb.com iceweb.org iceweb.io

/**
 *
 * 不优雅写法2
 * 利用了then链式调用这一特性，返回了一个新的promise
 */

requestData("iceweb.io")
    .then((res) => {
        return requestData(`iceweb.org ${res}`);
    })
    .then((res) => {
        return requestData(`iceweb.com ${res}`);
    })
    .then((res) => {
        console.log(res);
    });

//iceweb.com iceweb.org iceweb.io

/**
 * 思考一下，是否可以写成同步的方式呢？
 */

/**
 *  生成器+Promise解法
 */

function* getData1(url) {
    console.log(url);
    const res1 = yield requestData(url);
    const res2 = yield requestData(res1);
    const res3 = yield requestData(res2);

    console.log(res3);
}

const generator = getData1("iceweb.io");

generator.next().value.then((res1) => {
    generator.next(`iceweb.org ${res1}`).value.then((res2) => {
        generator.next(`iceweb.com ${res2}`).value.then((res3) => {
            generator.next(res3);
        });
    });
});

//iceweb.com iceweb.org iceweb.io

// getData已经变为同步的形式, 但是 generator一直调用.next不是也产生了回调地狱
// 可以看出迭代器的调用是有规律的，我们可以封装成一个函数

/**
 * 自动化执行函数封装
 */

//自动化执行 async await相当于自动帮我们执行.next

function* getData() {
    const res1 = yield requestData("iceweb.io");
    const res2 = yield requestData(`iceweb.org ${res1}`);
    const res3 = yield requestData(`iceweb.com ${res2}`);
    console.log(res3);
}

function _async(genFn) {
    const generator = genFn();

    const _automation = (result) => {
        let nextData = generator.next(result);
        if (nextData.done) return;

        nextData.value.then((res) => {
            _automation(res);
        });
    };

    _automation();
}

_async(getData);

//iceweb.com iceweb.org iceweb.io

// 利用promise+生成器的方式变相实现解决回调地狱问题，其实就是async await的一个变种而已
// 最早为TJ实现，前端大神人物
// async await核心代码就类似这些，内部主动帮我们调用.next方法

/**
 * async/await 解决回调地狱
 */

function _requestData(url) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (url.includes("iceweb")) {
                resolve(url);
            } else {
                reject("请求错误");
            }
        }, 1000);
    });
}

// 最后解决方式
async function _getData() {
    const res1 = await _requestData("iceweb.io");
    const res2 = await _requestData(`iceweb.org ${res1}`);
    const res3 = await _requestData(`iceweb.com ${res2}`);

    console.log(res3);
}

_getData();

//iceweb.com iceweb.org iceweb.io
