# 数据库支持emoji

## utf8mb4

utf8mb4的字符集，这个字符集能够支持４字节的UTF8编码的字符.

utf8mb4字符集能够完美地兼容utf8字符串.

在数据存储方面，当一个普通中文字符存入数据库时仍然占用３个字节，在存入一个Unified Emoji表情的时个它会自动占用４个字节。所以在输入输出时都不会存在乱码的问题了.

由于utf8mb4是utf8的超集，从utf8升级到utf8mb4不会有任何的问题，直接升级即可；如果从别的字符集如gb2312或者gbk转化而来，一定要先备份数据库。然后，修改MySQL的配置文件/etc/my.cnf,修改连接默认字符集为utf8mb4，然后在连接数据库以后首先执行一句SQL:SET NAMES utf8mb4;


总结： 根据业务，如果是一些文本类业务表，且有选择字符集的权利的时候，尽量使用utf8mb4.