# ChromeDriver

ChromeDriver是一个`用于自动化控制和与Google Chrome浏览器进行交互的驱动程序`。它是Chrome浏览器的一个开源项目，由Chrome开发团队开发和维护。

ChromeDriver允许开发人员使用编程语言（如Python、Java、C#等）编写脚本，以控制Chrome浏览器的行为。

通过ChromeDriver，您可以模拟用户在浏览器中执行的各种操作，例如打开网页、填写表单、点击按钮、滚动页面等。这使得自动化测试和网页数据爬取变得更加简单和高效。

> ChromeDriver与特定版本的Chrome浏览器相对应，因此在使用ChromeDriver之前，您需要确保安装与您当前使用的Chrome浏览器版本相匹配的ChromeDriver版本。这样可以确保ChromeDriver能够与浏览器正确地进行通信和控制。

ChromeDriver在自动化测试、网页爬虫、网页截图、性能测试等领域被广泛使用。它为开发人员提供了一种方便的方式来控制和管理Chrome浏览器，以实现各种自动化任务。



## 下载

> 淘宝镜像：https://registry.npmmirror.com/binary.html?path=chromedriver/
> 官方镜像：https://chromedriver.storage.googleapis.com/index.html
> 官方镜像2： https://chromedriver.chromium.org/downloads
> 最新版本链接：https://googlechromelabs.github.io/chrome-for-testing/  在此地址可以下载到chrome包


## selenium中chrome驱动程序chromedriver

Selenium是一个自动化测试工具，它可以模拟用户在浏览器中的操作，例如点击、输入文本、验证元素等

> Selenium中文文档：https://www.selenium.dev/zh-cn/documentation/webdriver/
> 入门使用：https://zhuanlan.zhihu.com/p/624609317
> 中文翻译文档： https://selenium-python-zh.readthedocs.io/en/latest/

### 1. SergeyPirogov写的浏览器驱动管理器，webdriver-manager

```sh
# 安装该管理器
pip install webdriver-manager
```

```py
from selenium import webdriver
# 然后导入该包
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
# 设置service，通过ChromeDriverManager().install()来获取驱动，从而省去了下载驱动和设置驱动的步骤
service = ChromeService(executable_path=ChromeDriverManager().install())
# 然后驱动加载该service
driver = webdriver.Chrome(service=service)
driver.quit()
```

非常强大，同时还可以指定浏览器文件等


### 2.传统方法- 手动导入webdriver

```py
# 导入Service的包
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService

# 然后通过Service设置驱动，CHROMEDRIVER_PATH替换为你的驱动位置
options = webdriver.ChromeOptions()
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option("useAutomationExtension", False)
service = ChromeService(executable_path=CHROMEDRIVER_PATH)

# 最后在webdriver.Chrome中调用这个service
driver = webdriver.Chrome(service=service, options=options)

```


### 3. selenium不带自己的浏览器，可以指定浏览器执行文件

[https://github.com/clemfromspace/scrapy-selenium](https://github.com/clemfromspace/scrapy-selenium) 此源码包中

- SELENIUM_DRIVER_EXECUTABLE_PATH   指定driver执行文件
- SELENIUM_BROWSER_EXECUTABLE_PATH  指定浏览器执行文件

### 4. 以上方案还是不是很好，因为需要手动配置不同平台的执行文件。还要os查找路径。 使用Phantomjs（无界面的浏览器）来直接指定浏览器

[https://www.cnblogs.com/ypppt/p/13323374.html](https://www.cnblogs.com/ypppt/p/13323374.html)