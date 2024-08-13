# Web上的透明视频 


## 腾讯有个动效插件做到给视频增加透明度通道，解码使用canvas播放，自己做解码器播放

## 浏览器原生的方式讨论

1. avif天然支持透明通道，但是在Safari不支持,avif的性能很糟糕
2. Safari中可以使用`<img>`播放视频，但在chrome中不支持
3. VP9 + HEVC chrome中使用vp9, 在safari中使用hevc, 通过 VP9 编解码器，其大小为 1.1 MB；在 Safari 中，通过 HEVC 编解码器，其大小为 3.4 MB
   - Chrome Android 版的 alpha 通道错误。根据您使用的透明度，这可能不会有太大影响。此问题已在 Canary 中修复，但在撰写本文时，尚未达到稳定状态
   - 在 Android 版 Firefox 上，播放经常停顿。
   - hevc是苹果专有的格式，使用ffmpeg编码一个有点糟糕，尽量使用Compressor(收费)


## 最终解决方案

```html
<stacked-alpha-video>
  <video autoplay crossorigin muted playsinline loop>
    <source
      src="av1.mp4"
      type="video/mp4; codecs=av01.0.08M.08.0.110.01.01.01.1"
    />
    <source src="hevc.mp4" type="video/mp4; codecs=hvc1.1.6.H120.b0" />
  </video>
</stacked-alpha-video>
```

> Apple 设备上有硬件解码器（iPhone 15 Pro、M3 MacBook Pro），则 Safari 将使用 AV1

使用作者提供的组件，进行av1和hevc的播放

- 原文地址[https://github.com/jakearchibald/jakearchibald.com/blob/main/static-build/posts/2024/08/video-with-transparency/index.md](https://github.com/jakearchibald/jakearchibald.com/blob/main/static-build/posts/2024/08/video-with-transparency/index.md)