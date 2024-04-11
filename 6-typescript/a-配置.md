
# 配置

## 直接初始化一个ts项目且有文件监听

```json
  "@types/node": "^18.16.0",
  "cross-env": "^7.0.3",
  "ts-node": "^10.9.1",
  "ts-node-dev": "^2.0.0",
  "typescript": "^5.0.4"
```

```json
"start": "cross-env -PROT 8888 ts-node-dev --respawn ./index.ts",
```