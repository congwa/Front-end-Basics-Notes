# 实现一个LazyMan，可以按照以下方式调用

```javascript
实现一个LazyMan，可以按照以下方式调用:

LazyMan("Hank")

输出:
Hi! This is Hank!

LazyMan("Hank").sleep(10).eat("dinner")

输出:
Hi! This is Hank!
//等待10秒..
Wake up after 10
Eat dinner~
 
LazyMan("Hank").eat("dinner").eat("supper") 

输出:
Hi This is Hank!
Eat dinner~
Eat supper~

LazyMan("Hank").sleepFirst(5).eat("supper")

输出:
//等待5秒
Wake up after 5
Hi This is Hank!
Eat supper
```

```javascript

  class LazyManFunc {
    constructor(ManName) {
      this.manName = ManName
      this.eventList = []
      setTimeout(() => {
        this._publish()
      })
      return this
    }
    static LazyMan (ManName) {
      return new LazyManFunc(ManName)
    }
    async _publish () {
      for (let i = 0; i < this.eventList.length; i++) {
        let event = this.eventList[i]
        await event.exec()
      }
      return this
    }
    _sleep (timeout) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, timeout)
      })
    }

    sleep (timeout) {
      this.eventList.push({
        exec: () => {
          return this._sleep(timeout)
        },
        eventName: 'sleep'
      })
      return this
    }
    sleepFirst (timeout) {
      this.eventList.unshift({
        exec: () => {
          return this._sleep(timeout * 1000)
            .then(() => {
              console.log('Wake up after ', timeout)
            })
        },
        eventName: 'sleepFirst'
      })
      return this
    }
    eat (meal) {
      this.eventList.push({
        exec: () => {
          return new Promise((resolve) => {
            console.log('Eat ', meal)
            resolve()
          })
        },
        eventName: 'eat'
      })
      return this
    }
  }
```
