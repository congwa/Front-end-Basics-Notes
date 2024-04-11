# vscode调试官方文档

[调试相关官网文档](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)


## 调试next.js程序示例

```json
{
  "version": "0.2.0",
  "configurations": [
     {
      "name": "Launch Program",
      "cwd":"${workspaceFolder}/client",
      "program": "${workspaceFolder}/client/node_modules/next/dist/bin/next",
      "request": "launch",
      "skipFiles": [
        "<node_internals>/**"
      ],
      "type": "node"
     }
  ]
}
```

如上代码，在vscode中，这段代码是在vscode上面调试strapi示例程序的client项目

- cwd进入项目根路径
- program在根路径上执行next启动脚本，使用node的调试模式