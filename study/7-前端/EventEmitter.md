# EventEmitter

```javascript
  class EventEmitter {
    constructor() {
      this.subs = Object.create(null)
    }
    $on(type, callback) {
      this.subs[type] = this.subs[type] || []
      this.subs[type].push(callback)
    }

    $emit(type, ...args) {
      if(this.subs[type]) {
        this.subs[type].forEach(() => {
          callback.call(this, ...args)
        })
      }
    }

    $off(type, callback) {
      if(this.subs[type]) {
        this.subs[type] = callback ? this.subs[type].filter(item => item !== callback || item.link !== callback) : []
      }
    }
    // link
    $once(type, callback) {
      let oneFunc = function(...args) {
        callback.call(this, ...args)
        this.$off(type, oneFunc)
      }
      oneFunc.link = callback
      this.$on(type, oneFunc)
    }
  }

```
