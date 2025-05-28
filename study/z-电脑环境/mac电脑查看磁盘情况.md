# mac电脑查看磁盘情况

```sh
# 安装
brew install wget smartmontools

# 查看
smartctl -a disk0


```

```sh
# mac ip情况
ifconfig | grep "inet "
```

## mac查看电池情况
```sh
ioreg -rn AppleSmartBattery | awk '/AppleRawMaxCapacity/{raw=$NF} /DesignCapacity/{design=$NF} /CycleCount/{cycle=$NF} END{printf "当前最大容量: %d mAh | 设计容量: %d mAh | 循环次数 %d 次 | 健康度: %.1f%%\n", raw, design, cycle, (raw/design)*100}'
# 当前最大容量: 7453 mAh | 设计容量: 8790 mAh | 循环次数 1000 次 | 健康度: 84.8%
```