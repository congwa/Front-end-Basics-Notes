# JSON树转换

```javascript
let flatArr = [
	{ id: 1, title: "title1", parent_id: 0 },
	{ id: 2, title: "title2", parent_id: 0 },
	{ id: 3, title: "title2-1", parent_id: 2 },
	{ id: 4, title: "title3-1", parent_id: 3 },
	{ id: 5, title: "title4-1", parent_id: 4 },
	{ id: 6, title: "title3-2", parent_id: 3 },
];

// 一直操作的是同一份引用
const covert = function (list) {
    const result = []
    const map = list.reduce((target, current) => {
        target[current.id] = current
        return target
    },{})

    for(let item of list) {
        if(item.parent_id === 0) {
            result.push(item)
            continue
        }
        if(item.parent_id in map) {
            let parent = map[item.parent_id]
            parent.children = parent.children || []
            parent.children.push(item)
        }
    }
    return result
}

const treeArr = covert(flatArr)
console.log('treeArr', treeArr)


const flatTree = function (tree) {
    return tree.reduce((target, current) => {
        const {id, parent_id, title } = current
        const cur = {id, parent_id, title }
        // return [...target, cur, ...flatTree(current.children || [])]
        
        return target.concat([cur], (current.children && current.children.length)? flatTree(current.children): [])    
    },[])
}

const flatT = flatTree(treeArr)

console.log('flatArr', flatT)
```