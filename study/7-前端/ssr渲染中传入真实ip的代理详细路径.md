# ssr渲染中传入真实ip的代理详细路径

在每一层代理和服务器中，为了更清晰地记录和追踪请求的头信息 (`X-Forwarded-For`) 和 IP (`remoteAddress` 或 `remote_addr`)，我们可以在每个节点上插入相应的代码来记录当前状态和更新的操作。

以下是完整的代码和详细解释。

---

### 1. **第一层代理 (Nginx proxy1)**

Nginx 配置如下，用于更新 `X-Forwarded-For` 和转发请求到 Node.js (`proxy2`)。

#### **Nginx 配置**

```nginx
server {
    listen 80;
    server_name proxy1.example.com;

    location / {
        proxy_pass http://203.0.113.2:3000; # 转发到 Node.js
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

**日志输出**

- `$remote_addr`: `192.168.1.10`（客户端 IP）
- `$proxy_add_x_forwarded_for`: 自动追加 IP (`192.168.1.10`) 到 `X-Forwarded-For`

---

### 2. **第二层代理 (Node.js proxy2)**

Node.js 接收请求并将自己的 IP (`203.0.113.2`) 加入到 `X-Forwarded-For` 中。

#### **Node.js 代码**

```javascript
const express = require('express');
const app = express();

app.use((req, res, next) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const proxyIP = req.socket.remoteAddress;

    console.log(`Node.js (proxy2):
        - X-Forwarded-For: ${req.headers['x-forwarded-for']}
        - Client IP: ${clientIP}
        - Proxy IP: ${proxyIP}`);
    
    // 添加自己的 IP 到 X-Forwarded-For
    req.headers['x-forwarded-for'] = 
        `${proxyIP},${req.headers['x-forwarded-for'] || ''}`.replace(/,$/, '');
    next();
});

app.get('/', (req, res) => {
    res.send('Request passed through Node.js proxy2');
});

app.listen(3000, () => {
    console.log('Node.js proxy2 running on port 3000');
});
```

**日志输出**

- 初始 `X-Forwarded-For`: `192.168.1.10`
- 更新后的 `X-Forwarded-For`: `203.0.113.2, 192.168.1.10`

---

### 3. **第三层代理 (Nginx proxy3)**

第三层代理将接收到的 `X-Forwarded-For` 信息再次更新并转发到 Flask。

#### **Nginx 配置**

```nginx
server {
    listen 80;
    server_name proxy3.example.com;

    location / {
        proxy_pass http://203.0.113.3:5000; # 转发到 Flask
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

**日志输出**

- `$remote_addr`: `203.0.113.2`（Node.js 的 IP）
- `$proxy_add_x_forwarded_for`: 自动追加 `203.0.113.2`

最终的 `X-Forwarded-For`:

```
203.0.113.2, 192.168.1.10
```

---

### 4. **目标服务器 (Flask)**

Flask 应用最终接收到请求，可以解析 `X-Forwarded-For` 来获取完整的 IP 路径。

#### **Flask 代码**

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/')
def get_ip():
    # 从头部获取 X-Forwarded-For
    x_forwarded_for = request.headers.get('X-Forwarded-For', '')
    remote_addr = request.remote_addr

    print(f"Flask (Final Server):
        - X-Forwarded-For: {x_forwarded_for}
        - Remote Addr: {remote_addr}")
    
    # 提取最原始的客户端 IP
    if x_forwarded_for:
        ip_list = [ip.strip() for ip in x_forwarded_for.split(',')]
        original_ip = ip_list[-1]  # 最初客户端 IP
    else:
        original_ip = remote_addr

    return f"Original Client IP: {original_ip}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**日志输出**

- `X-Forwarded-For`: `203.0.113.2, 203.0.113.1, 192.168.1.10`
- `request.remote_addr`: `203.0.113.3`（proxy3 的 IP）

最终解析得到的最初客户端 IP 是：`192.168.1.10`。

---

### **最终请求的 IP 头信息变化**

| 节点          | `X-Forwarded-For`                     | `remoteAddress` (或 `remote_addr`)  |
|---------------|---------------------------------------|-------------------------------------|
| **Client**    | 无                                    | `192.168.1.10`                     |
| **proxy1**    | `192.168.1.10`                        | `192.168.1.10`                     |
| **proxy2**    | `203.0.113.1, 192.168.1.10`           | `203.0.113.1`                      |
| **proxy3**    | `203.0.113.2, 203.0.113.1, 192.168.1.10` | `203.0.113.2`                      |
| **Flask**     | `203.0.113.2, 203.0.113.1, 192.168.1.10` | `203.0.113.3`                      |

### 总结

1. **`X-Forwarded-For`** 记录了完整的 IP 链路，越靠右的 IP 越接近客户端。
2. **`req.socket.remoteAddress`** 在每一层只记录直接上游的 IP。
3. 最终在 Flask 中通过 `X-Forwarded-For` 可以提取最原始客户端 IP。
