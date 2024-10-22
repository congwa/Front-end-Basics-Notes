# ac自动机

```js
class TrieNode {
    constructor() {
        this.children = {};
        this.isEnd = false;
        this.output = []; // 存储匹配的敏感词
        this.failure = null; // 失败指针
    }
}

class AhoCorasick {
    constructor(keywords) {
        this.root = new TrieNode();
        this.buildTrie(keywords);
        this.buildFailureLinks();
    }

    buildTrie(keywords) {
        for (const keyword of keywords) {
            let current = this.root;
            for (const char of keyword) {
                if (!current.children[char]) {
                    current.children[char] = new TrieNode();
                }
                current = current.children[char];
            }
            current.isEnd = true;
            current.output.push(keyword); // 添加敏感词
        }
    }

    buildFailureLinks() {
        const queue = [];
        for (const child of Object.values(this.root.children)) {
            child.failure = this.root; // 根节点的失败指针指向自身
            queue.push(child);
        }

        while (queue.length > 0) {
            const current = queue.shift();
            for (const [char, child] of Object.entries(current.children)) {
                queue.push(child);
                let failNode = current.failure;
                while (failNode && !failNode.children[char]) {
                    failNode = failNode.failure;
                }
                child.failure = failNode ? failNode.children[char] : this.root;
                child.output.push(...(child.failure.output || [])); // 合并输出
            }
        }
    }

    search(text) {
        let current = this.root;
        const results = [];

        for (let index = 0; index < text.length; index++) {
            const char = text[index];

            // 处理不匹配的情况
            while (current && !current.children[char]) {
                current = current.failure;
            }

            if (!current) {
                current = this.root;
                continue; // 跳到下一个字符
            }

            current = current.children[char];

            // 找到匹配的敏感词
            if (current.output.length > 0) {
                for (const pattern of current.output) {
                    results.push({ position: index, pattern }); // 记录匹配位置和模式
                }
            }
        }

        return results;
    }
}

// 示例使用
const keywords = ['he', 'she', 'his', 'hers'];
const ac = new AhoCorasick(keywords);
const text = 'ushers';
const results = ac.search(text);

console.log(results); 
// 输出：
// [
//   { position: 5, pattern: 'she' },
//   { position: 6, pattern: 'he' },
//   { position: 7, pattern: 'hers' }
// ]

```

## 使用ac自动机进行敏感词替换

```js
function replaceSensitiveWords(text, keywords) {
    const ac = new AhoCorasick(keywords);
    const matches = ac.search(text);
    let result = text.split(''); // 将字符串转换为字符数组以便替换

    // 使用匹配信息替换敏感词
    for (const match of matches) {
        const { position, pattern } = match;
        const patternLength = pattern.length;

        // 将匹配的敏感词替换为星号
        for (let i = 0; i < patternLength; i++) {
            result[position - patternLength + 1 + i] = '*'; // 使用星号替换
        }
    }

    return result.join(''); // 将字符数组转换回字符串
}


const sensitiveWords = ['bad', 'word', 'test'];
const inputText = 'This is a test of bad words.';

const result = replaceSensitiveWords(inputText, sensitiveWords);
console.log(result); // 输出: "This is a **** of *** words."

```

- Trie 树：用于存储所有模式字符串，以便高效匹配。
- 失败指针：在匹配失败时快速回退，避免重复匹配。
- 搜索：通过一次扫描文本，利用 Trie 树和失败指针找到所有模式的匹配。
