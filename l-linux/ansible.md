# ansible

## why

- 手动配置管理： 在过去，系统管理员和运维团队通常使用**手动方法**来配置和管理服务器。这种方法容易出错、耗时且不可伸缩。
- 其他自动化工具： 在 Ansible 出现之前，一些其他自动化工具如 Puppet、Chef 和 SaltStack 等已经存在。这些工具有一些优点，但它们可能需要更复杂的配置，**需要在被管理的主机上部署客户端**，而 Ansible 通过使用 SSH 来避免了这些问题。

ansible解决了以上痛点

- Agentless 架构： Ansible 采用了一种 "无客户端"（Agentless）的架构，**通过 SSH 协议直接与目标主机通信，不需要在目标主机上安装客户端**。这简化了配置和减少了对被管理主机的依赖。
- YAML 语法： Ansible **使用 YAML 语言来定义任务和配置**，这使得 Playbooks（Ansible 配置文件）易读且易于编写。YAML 的语法简洁且可读性强。
- 模块化设计： Ansible 的操作是基于模块的，**模块可以用于执行各种任务**，如文件操作、包管理、服务管理等。这种模块化设计使得 Ansible 非常灵活，可适应各种场景。
- 社区支持： Ansible 拥有庞大的社区支持，用户和开发者积极参与，并提供丰富的模块和 Playbooks，方便用户共享和重用。
- 广泛应用： Ansible 不仅在配置管理领域得到广泛应用，还被用于应用程序部署、云基础设施管理等各种场景。
- Red Hat 收购： 2015 年，Red Hat 收购了 Ansible Inc.，这进一步推动了 Ansible 的发展和整合。

## 安装、配置 - centos为例


安装

```sh
# 安装 Ansible 及其依赖项
yum install epel-release
yum install ansible
```

配置

1. 打开 Ansible 的主配置文件 `/etc/ansible/ansible.cfg` 并进行必要的配置
2. 打开 Ansible 的主机清单文件` /etc/ansible/hosts `并**添加您的目标主机**
   
   ```ini
   # [web_servers] 是一个组名，后面的IP地址是目标主机的地址
    [web_servers]
    192.168.1.100
    192.168.1.101
   ```

3. 测试连接
    
    ```sh
      # 确保连接到目标主机
      ansible all -m ping
    ```

## yml的使用

```yml
# Ansible Playbook 文件 来定义您的任务
# 根据 Playbook 中的定义，在目标主机上安装 Nginx
---
- name: Install Nginx
  hosts: web_servers
  become: true
  tasks:
    - name: Update package cache
      yum:
        name: "*"
        state: latest
    - name: Install Nginx
      yum:
        name: nginx
        state: latest

```

```sh
# 运行 Playbook
ansible-playbook site.yml
```

## 命令行使用

```sh
# all表示主机清单中的主机
# ansible all -m yum 在所有机器上执行yum模块
# -a 指定模块参数 将参数 "name=httpd state=present" 传递给指定的yum模块

# 在所有节点上安装httpd
ansible all -m yum -a "state=present name=httpd"

# 在所有节点上启动服务，并开机自启动
ansible all -m service -a 'name=httpd state=started enabled=yes'

# * 表示所有主机，不论它们是否在主机清单文件中， 这包括在清单文件中定义的主机以及动态清单、组合主机和其他来源的主机
# 检查主机连接
ansible '*' -m ping

# 执行远程命令
ansible '*' -m command -a 'uptime'

# 执行主控端脚本
ansible '*' -m script -a '/root/test.sh'

# 执行远程主机的脚本
# shell 模块用于执行 Shell 命令
ansible '*' -m shell -a 'ps aux|grep zabbix'

# 类似shell
# raw 模块用于执行原始命令
ansible '*' -m raw -a "ps aux|grep zabbix|awk '{print \$2}'"

# 复制文件到远程服务器
ansible '*' -m copy -a "src=/etc/ansible/ansible.cfg dest=/tmp/ansible.cfg owner=root group=root mode=0644"
# src=/etc/ansible/ansible.cfg：指定本地文件的路径。
# dest=/tmp/ansible.cfg：指定目标主机上的目标路径。
# owner=root：指定复制后文件的所有者。
# group=root：指定复制后文件的所属组。
# mode=0644：指定复制后文件的权限模式。

```