
# [死机问题](https://www.v2ex.com/t/893312)

如果是 intel 的电脑可以试试把这个 Intel(R) Management Engine Interface #1 设备的"允许关闭设备以节约电源"选项关闭

另外这情况很像是我之前看到一篇分析 windows8 消费者预览版的情况，现将原文复制下来

win8cp 在实体机上动不动就死机，此时鼠标能动（有时还能选中桌面图标），但是有关 CPU 监测软件都是暂停的，时钟也没在走，特别是挂百度网盘时经常会这样，必须重启，但在虚拟机上没事。
查了下发现是 dynamic tick 的锅，这个机制在 RP 前有 bug ，会误将系统当做空闲然后暂停 CPU ，把这个关闭后发现基本没死机过。
cmd 管理员身份运行，bcdedit /set disabledynamictick yes 即可。