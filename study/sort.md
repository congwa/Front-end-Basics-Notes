# 排序


## 快速排序

```javascript
  const quickSort = (arr) => {
    if(arr.length <= 1) {
      return arr
    }
    const base = arr[0]
    const left = []
    const right = []
    arr.forEach(v => {
      if(v > base) {
        right.push(v)
      }
      if(v < base) {
        left.push(v)
      }
    })
    return quickSort(left).concat(base, quickSort(right))
  }
```