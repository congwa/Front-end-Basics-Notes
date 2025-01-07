# OPFS (Origin Private File System) 文件系统

## 简介

OPFS (Origin Private File System) 是 Web 提供的通用存储能力，具有以下特征：

- 它是一个完整的文件系统，提供底层的文件操作 API，不限于特定存储场景
- 可对 Web 同源的文件自由进行读写操作，无需用户手动授权
- 对文件的访问经过高度性能优化
- 在 Chrome 86 后可用，主流浏览器均已支持

## Web 存储发展历程

Web 平台提供了多种存储 API 用于解决特定场景：

| API | 场景 |
|-----|------|
| localStorage | 键/值对字符串存储，可用空间小 |
| sessionStorage | 同上，区别在于会话结束时会被清除 |
| indexeddb | 用于在客户端存储大量的结构化数据 |
| Caches | 一般用于在 ServiceWorker 中网络缓存资源 |

## OPFS 基础用法

### 基础读写文件

```javascript
const opfsRoot = await navigator.storage.getDirectory();

// 创建目录
const dirHandle = await opfsRoot.getDirectoryHandle('dir', {
  create: true,
});

// 创建文件
const fileHandle = await dirHandle.getFileHandle('my first file', {
  create: true,
});

// 写入文件
const writable = await saveHandle.createWritable();
await writable.write('测试数据');
await writable.close();

// 读取文件
const file = await fileHandle.getFile();
await file.slice(0, file.size);
```

### Worker 同步读写

同步读写性能更好，`fileHandle.createSyncAccessHandle` API 须在 WebWorker 中才能运行：

```javascript
const fileHandle = await opfsRoot.getFileHandle('my highspeed file.txt', {
  create: true,
});
const accessHandle = await fileHandle.createSyncAccessHandle();

// 同步写入
const content = textEncoder.encode('Some text');
accessHandle.write(content, { at: accessHandle.getSize() });
accessHandle.flush();

// 同步读取
const buf = new ArrayBuffer(10);
accessHandle.read(buf); // 返回实际读取字节数
```

## opfs-tools 工具库

opfs-tools 是基于 OPFS 封装的高级 API 库，提供更简洁的使用方式：

### 主要特性

1. 允许直接读写常见数据类型（文本、二进制、流），无需转换成二进制
2. 可直接处理字符串 path，无需循环获取深层级的目录或文件
3. 提供便捷的 API 操作 file/dir，如复制、移动、删除
4. 自动将读写请求代理到 WebWorker，性能更好

### 基础用法

```javascript
import { file, dir, write } from 'opfs-tools';

// 创建和写入
await dir('/test-dir').create(); // 创建目录
await write('/dir/file.txt', ''); // 创建空文件
await write('/dir/fetch-file', (await fetch('//example.com')).body);

// 读取
await file('/dir/file.txt').text();
await file('/dir/input-file').arrayBuffer();
await file('/dir/input-file').stream();
await dir('/test-dir').children();

// 删除
await dir('/test-dir').remove();
await file('/dir/file.txt').remove();

// 复制和移动
await file('/dir/file').copyTo(file('/dir/file copy1'));
await dir('/dir').moveTo(dir('/.Trash'));
```

## 性能优化

1. OPFS 在 WebWorker 中同步读写性能最佳
2. 主线程通过 WebWorker 代理读写操作比直接读写更快
3. 高频读写场景能提升 3～6 倍的性能
4. 利用 Transferable object 特性，ArrayBuffer 在线程间转移成本很低

## 注意事项

1. OPFS 的文件对用户是不可见的，在操作系统中找不到对应文件
2. 读写文件不需要用户授权，但文件可能被浏览器自动清除
3. 永久性存储需要调用 `navigator.storage.persist()` 申请权限
4. 受同源策略限制，无法跨源访问存储数据
5. 根目录 `/` 是按源隔离的，不是系统根目录

## 开发工具

opfs-tools-explorer 是一个可视化的 OPFS 文件管理工具：

```html
<script src="https://cdn.jsdelivr.net/npm/opfs-tools-explorer"></script>
<script>
  OTExplorer.init();
</script>
```

## 相关资源

- [opfs-tools](https://github.com/hughfenghen/opfs-tools) - 简洁高效的文件系统 API
- [opfs-tools-explorer](https://github.com/hughfenghen/opfs-tools-explorer) - 可视化管理工具
- [MDN OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [Web.dev OPFS](https://web.dev/file-system-access/) 