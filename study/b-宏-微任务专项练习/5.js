function promiseAsyncDelay(n) {
    console.log(`start ${n / 100}`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(`end ${n / 100}`);
            resolve();
        }, n);
    });
}

async function run() {
    await promiseAsyncDelay(300);
    await promiseAsyncDelay(200);
    await promiseAsyncDelay(100);
}

run();

// start3
// end3
// strt2
// end2
// start1
// end1