# 介绍

权限管理在几乎每个系统中都是必备的模块。如果项目开发每次都要实现一次权限管理，无疑会浪费开发时间，增加开发成本。因此，Casbin 库出现了。Casbin 是一个强大、高效的访问控制库。支持常用的多种访问控制模型，如 ACL/RBAC/ABAC 等。可以实现灵活的访问权限控制。同时，Casbin 支持多种编程语言，Go/Java/Node/PHP/Python/.NET/Rust。我们只需要一次学习，多处运用。

## 快速使用

我们依然使用 Go Module 编写代码，先初始化：

```shell
$ mkdir casbin && cd casbin
$ go mod init github.com/darjun/go-daily-lib/casbin
```

然后安装 Casbin，目前是 v2 版本：

```shell
$ go get github.com/casbin/casbin/v2
```

权限实际上就是控制谁能对什么资源进行什么操作。Casbin 将访问控制模型抽象到一个基于 PERM（Policy，Effect，Request，Matchers） 元模型的配置文件（模型文件）中。因此切换或更新授权机制只需要简单地修改配置文件。

policy 是策略或者说是规则的定义。它定义了具体的规则。

request 是对访问请求的抽象，它与 e.Enforce() 函数的参数是一一对应的

matcher 匹配器会将请求与定义的每个 policy 一一匹配，生成多个匹配结果。

effect 根据对请求运用匹配器得出的所有结果进行汇总，来决定该请求是允许还是拒绝。

下面这张图很好地描绘了这个过程：

![Casbin 模型解析流程](/study/imgs/casbin1.png)

我们首先编写模型文件：

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act

[policy_effect]
e = some(where (p.eft == allow))
```

上面模型文件规定了权限由 sub、obj、act 三要素组成，只有在策略列表中有和它完全相同的策略时，该请求才能通过。匹配器的结果可以通过 p.eft 获取，some(where (p.eft == allow)) 表示只要有一条策略允许即可。

然后我们策略文件（即谁能对什么资源进行什么操作）：

```csv
p, dajun, data1, read
p, lizi, data2, write
```

上面 policy.csv 文件的两行内容表示 dajun 对数据 data1 有 read 权限，lizi 对数据 data2 有 write 权限。

接下来就是使用的代码：

```go
package main

import (
  "fmt"
  "log"

  "github.com/casbin/casbin/v2"
)

func check(e *casbin.Enforcer, sub, obj, act string) {
  ok, _ := e.Enforce(sub, obj, act)
  if ok {
    fmt.Printf("%s CAN %s %s\n", sub, act, obj)
  } else {
    fmt.Printf("%s CANNOT %s %s\n", sub, act, obj)
  }
}

func main() {
  e, err := casbin.NewEnforcer("./model.conf", "./policy.csv")
  if err != nil {
    log.Fatalf("NewEnforecer failed:%v\n", err)
  }

  check(e, "dajun", "data1", "read")
  check(e, "lizi", "data2", "write")
  check(e, "dajun", "data1", "write")
  check(e, "dajun", "data2", "read")
}
```

代码其实不复杂。首先创建一个 Casbin.Enforcer 对象，加载模型文件 model.conf 和策略文件 policy.csv，调用其 Enforce 方法来检查权限。

运行程序：

```shell
$ go run main.go
dajun CAN read data1
lizi CAN write data2
dajun CANNOT write data1
dajun CANNOT read data2
```

请求必须完全匹配某条策略才能通过。("dajun", "data1", "read") 匹配 p, dajun, data1, read，("lizi", "data2", "write") 匹配 p, lizi, data2, write，所以前两个检查通过。第 3 个因为 "dajun" 没有对 data1 的 write 权限，第 4 个因为 dajun 对 data2 没有 read 权限，所以检查都不能通过。输出结果符合预期。

sub/obj/act 依次对应传给 Enforce 方法的三个参数。实际上这里的 sub/obj/act 和 read/write/data1/data2 是我自己随便取的，你完全可以使用其它的名字，只要能前后一致即可。

上面例子中实现的就是 ACL（access-control-list，访问控制列表）。ACL 显示定义了每个主体对每个资源的权限情况，未定义的就没有权限。我们还可以加上超级管理员，超级管理员可以进行任何操作。假设超级管理员为 root，我们只需要修改匹配器：

```ini
[matchers]
e = r.sub == p.sub && r.obj == p.obj && r.act == p.act || r.sub == "root"
```

只要访问主体是 root 一律放行。

**验证**

```go
package main

import (
  "fmt"
  "log"

  "github.com/casbin/casbin/v2"
)

func check(e *casbin.Enforcer, sub, obj, act string) {
  ok, _ := e.Enforce(sub, obj, act)
  if ok {
    fmt.Printf("%s CAN %s %s\n", sub, act, obj)
  } else {
    fmt.Printf("%s CANNOT %s %s\n", sub, act, obj)
  }
}

func main() {
  e, err := casbin.NewEnforcer("./model.conf", "./policy.csv")
  if err != nil {
    log.Fatalf("NewEnforecer failed:%v\n", err)
  }

  check(e, "root", "data1", "read")
  check(e, "root", "data2", "write")
  check(e, "root", "data1", "execute")
  check(e, "root", "data3", "rwx")
}
```

因为sub = "root"时，匹配器一定能通过，运行结果：

```bash
root CAN read data1
root CAN write data2
root CAN execute data1
root CAN rwx data3
```

## RBAC 模型

ACL模型在用户和资源都比较少的情况下没什么问题，但是用户和资源量一大，ACL就会变得异常繁琐。想象一下，每次新增一个用户，都要把他需要的权限重新设置一遍是多么地痛苦。RBAC（role-based-access-control）模型通过引入角色（role）这个中间层来解决这个问题。每个用户都属于一个角色，例如开发者、管理员、运维等，每个角色都有其特定的权限，权限的增加和删除都通过角色来进行。这样新增一个用户时，我们只需要给他指派一个角色，他就能拥有该角色的所有权限。修改角色的权限时，属于这个角色的用户权限就会相应的修改。

在casbin中使用RBAC模型需要在模型文件中添加role_definition模块：

```ini
[role_definition]
g = _, _

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

g = _,_ 定义了用户——角色，角色——角色的映射关系，前者是后者的成员，拥有后者的权限。然后在匹配器中，我们不需要判断r.sub与p.sub完全相等，只需要使用g(r.sub, p.sub)来判断请求主体r.sub是否属于p.sub这个角色即可。最后我们修改策略文件添加用户——角色定义：

```ini
p, admin, data, read
p, admin, data, write
p, developer, data, read

g, dajun, admin
g, lizi, developer
```

上面的policy.csv文件规定了，dajun属于admin管理员，lizi属于developer开发者，使用g来定义这层关系。另外admin对数据data用read和write权限，而developer对数据data只有read权限。

```go
package main

import (
  "fmt"
  "log"

  "github.com/casbin/casbin/v2"
)

func check(e *casbin.Enforcer, sub, obj, act string) {
  ok, _ := e.Enforce(sub, obj, act)
  if ok {
    fmt.Printf("%s CAN %s %s\n", sub, act, obj)
  } else {
    fmt.Printf("%s CANNOT %s %s\n", sub, act, obj)
  }
}

func main() {
  e, err := casbin.NewEnforcer("./model.conf", "./policy.csv")
  if err != nil {
    log.Fatalf("NewEnforecer failed:%v\n", err)
  }

  check(e, "dajun", "data", "read")
  check(e, "dajun", "data", "write")
  check(e, "lizi", "data", "read")
  check(e, "lizi", "data", "write")
}
```

很显然lizi所属角色没有write权限：

```bash
dajun CAN read data
dajun CAN write data
lizi CAN read data
lizi CANNOT write data
```

### 多个RBAC

```ini
[role_definition]
g=_,_
g2=_,_

[matchers]
m = g(r.sub, p.sub) && g2(r.obj, 
```


上面的模型文件定义了两个RBAC系统g和g2，我们在匹配器中使用g(r.sub, p.sub)判断请求主体属于特定组，g2(r.obj, p.obj)判断请求资源属于特定组，且操作一致即可放行。

策略文件:

```ini
p, admin, prod, read
p, admin, prod, write
p, admin, dev, read
p, admin, dev, write
p, developer, dev, read
p, developer, dev, write
p, developer, prod, read
g, dajun, admin
g, lizi, developer
g2, prod.data, prod
g2, dev.data, dev
```

先看角色关系，即最后 4 行，dajun属于admin角色，lizi属于developer角色，prod.data属于生产资源prod角色，dev.data属于开发资源dev角色。admin角色拥有对prod和dev类资源的读写权限，developer只能拥有对dev的读写权限和prod的读权限。

```go
check(e, "dajun", "prod.data", "read")
check(e, "dajun", "prod.data", "write")
check(e, "lizi", "dev.data", "read")
check(e, "lizi", "dev.data", "write")
check(e, "lizi", "prod.data", "write")
```

第一个函数中e.Enforce()方法在实际执行的时候先获取dajun所属角色admin，再获取prod.data所属角色prod，根据文件中第一行p, admin, prod, read允许请求。最后一个函数中lizi属于角色developer，而prod.data属于角色prod，所有策略都不允许，故该请求被拒绝：

```bash
dajun CAN read prod.data
dajun CAN write prod.data
lizi CAN read dev.data
lizi CAN write dev.data
lizi CANNOT write prod.data
```

### 多层角色

casbin还能为角色定义所属角色，从而实现多层角色关系，这种权限关系是可以传递的。例如dajun属于高级开发者senior，seinor属于开发者，那么dajun也属于开发者，拥有开发者的所有权限。我们可以定义开发者共有的权限，然后额外为senior定义一些特殊的权限。

模型文件不用修改，策略文件改动如下：

```csv
p, senior, data, write
p, developer, data, read
g, dajun, senior
g, senior, developer
g, lizi, developer
```

上面policy.csv文件定义了高级开发者senior对数据data有write权限，普通开发者developer对数据只有read权限。同时senior也是developer，所以senior也继承其read权限。dajun属于senior，所以dajun对data有read和write权限，而lizi只属于developer，对数据data只有read权限。

```go
check(e, "dajun", "data", "read")
check(e, "dajun", "data", "write")
check(e, "lizi", "data", "read")
check(e, "lizi", "data", "write")
```

上面是运行代码的结果，可以看到，在RBAC的基础上，我们定义了多层角色，在角色与角色之间建立了权限关系，从而实现了权限的传递。

```bash
dajun CAN read data
dajun CAN write data
lizi CAN read data
lizi CANNOT write data
```

### RBAC domain

在casbin中，角色可以是全局的，也可以是特定domain（领域）或tenant（租户），可以简单理解为组。例如dajun在组tenant1中是管理员，拥有比较高的权限，在tenant2可能只是个弟弟。

使用RBAC domain需要对模型文件做以下修改：

```ini
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _,_,_

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.obj
```

`g=_,_,_`表示前者在后者中拥有中间定义的角色，在匹配器中使用g要带上dom。

```csv
p, admin, tenant1, data1, read
p, admin, tenant2, data2, read
g, dajun, admin, tenant1
g, dajun, developer, tenant2
```

在tenant1中，只有admin可以读取数据data1。在tenant2中，只有admin可以读取数据data2。dajun在tenant1中是admin，但是在tenant2中不是。

```go
func check(e *casbin.Enforcer, sub, domain, obj, act string) {
  ok, _ := e.Enforce(sub, domain, obj, act)
  if ok {
    fmt.Printf("%s CAN %s %s in %s\n", sub, act, obj, domain)
  } else {
    fmt.Printf("%s CANNOT %s %s in %s\n", sub, act, obj, domain)
  }
}

func main() {
  e, err := casbin.NewEnforcer("./model.conf", "./policy.csv")
  if err != nil {
    log.Fatalf("NewEnforecer failed:%v\n", err)
  }

  check(e, "dajun", "tenant1", "data1", "read")
  check(e, "dajun", "tenant2", "data2", "read")
}
```

结果不出意料：

```bash
dajun CAN read data1 in tenant1
dajun CANNOT read data2 in tenant2
```


## ABAC

RBAC模型对于实现比较规则的、相对静态的权限管理非常有用。但是对于特殊的、动态的需求，RBAC就显得有点力不从心了。例如，我们在不同的时间段对数据data实现不同的权限控制。正常工作时间9:00-18:00所有人都可以读写data，其他时间只有数据所有者能读写。这种需求我们可以很方便地使用ABAC（attribute base access list）模型完成：

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[matchers]
m = r.sub.Hour >= 9 && r.sub.Hour < 18 || r.sub.Name == r.obj.Owner

[policy_effect]
e = some(where (p.eft == allow))
```

该规则不需要策略文件：

```go
type Object struct {
  Name  string
  Owner string
}

type Subject struct {
  Name string
  Hour int
}

func check(e *casbin.Enforcer, sub Subject, obj Object, act string) {
  ok, _ := e.Enforce(sub, obj, act)
  if ok {
    fmt.Printf("%s CAN %s %s at %d:00\n", sub.Name, act, obj.Name, sub.Hour)
  } else {
    fmt.Printf("%s CANNOT %s %s at %d:00\n", sub.Name, act, obj.Name, sub.Hour)
  }
}

func main() {
  e, err := casbin.NewEnforcer("./model.conf", "./policy.csv")
  if err != nil {
    log.Fatalf("NewEnforecer failed:%v\n", err)
  }

  o := Object{"data", "dajun"}
  s1 := Subject{"dajun", 10}
  check(e, s1, o, "read")

  s2 := Subject{"lizi", 10}
  check(e, s2, o, "read")

  s3 := Subject{"dajun", 20}
  check(e, s3, o, "read")

  s4 := Subject{"lizi", 20}
  check(e, s4, o, "read")
}
```


显然lizi在20:00不能read数据data：

```bash
dajun CAN read data at 10:00
lizi CAN read data at 10:00
dajun CAN read data at 20:00
lizi CANNOT read data at 20:00
```

我们知道，在model.conf文件中可以通过r.sub和r.obj，r.act来访问传给Enforce方法的参数。实际上sub/obj可以是结构体对象，得益于govaluate库的强大功能，我们可以在model.conf文件中获取这些结构体的字段值。如上面的r.sub.Name、r.Obj.Owner等。govaluate库的内容可以参见我之前的一篇文章《Go 每日一库之 govaluate》。

使用ABAC模型可以非常灵活的权限控制，但是一般情况下RBAC就已经够用了。


## 模型存储


上面代码中，我们一直将模型存储在文件中。casbin也可以实现在代码中动态初始化模型，例如get-started的例子可以改写为：

```go
func main() {
  m := model.NewModel()
  m.AddDef("r", "r", "sub, obj, act")
  m.AddDef("p", "p", "sub, obj, act")
  m.AddDef("e", "e", "some(where (p.eft == allow))")
  m.AddDef("m", "m", "r.sub == g.sub && r.obj == p.obj && r.act == p.act")

  a := fileadapter.NewAdapter("./policy.csv")
  e, err := casbin.NewEnforcer(m, a)
  if err != nil {
    log.Fatalf("NewEnforecer failed:%v\n", err)
  }

  check(e, "dajun", "data1", "read")
  check(e, "lizi", "data2", "write")
  check(e, "dajun", "data1", "write")
  check(e, "dajun", "data2", "read")
}
```

同样地，我们也可以从字符串中加载模型：

```go
func main() {
  text := `
  [request_definition]
  r = sub, obj, act
  
  [policy_definition]
  p = sub, obj, act
  
  [policy_effect]
  e = some(where (p.eft == allow))
  
  [matchers]
  m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
  `

  m, _ := model.NewModelFromString(text)
  a := fileadapter.NewAdapter("./policy.csv")
  e, _ := casbin.NewEnforcer(m, a)

  check(e, "dajun", "data1", "read")
  check(e, "lizi", "data2", "write")
  check(e, "dajun", "data1", "write")
  check(e, "dajun", "data2", "read")
}
```

但是这两种方式并不推荐。


## 策略存储

在前面的例子中，我们都是将策略存储在policy.csv文件中。一般在实际应用中，很少使用文件存储。casbin以第三方适配器的方式支持多种存储方式包括MySQL/MongoDB/Redis/Etcd等，还可以实现自己的存储。完整列表看这里https://casbin.org/docs/en/adapters。下面我们介绍使用Gorm Adapter。先连接到数据库，执行下面的SQL：

```sql
CREATE DATABASE IF NOT EXISTS casbin;

USE casbin;

CREATE TABLE IF NOT EXISTS casbin_rule (
  p_type VARCHAR(100) NOT NULL,
  v0 VARCHAR(100),
  v1 VARCHAR(100),
  v2 VARCHAR(100),
  v3 VARCHAR(100),
  v4 VARCHAR(100),
  v5 VARCHAR(100)
);

INSERT INTO casbin_rule VALUES
('p', 'dajun', 'data1', 'read', '', '', ''),
('p', 'lizi', 'data2', 'write', '', '', '');
```

然后使用Gorm Adapter加载policy，Gorm Adapter默认使用casbin库中的casbin_rule表：

```go
package main

import (
  "fmt"

  "github.com/casbin/casbin/v2"
  gormadapter "github.com/casbin/gorm-adapter/v2"
  _ "github.com/go-sql-driver/mysql"
)

func check(e *casbin.Enforcer, sub, obj, act string) {
  ok, _ := e.Enforce(sub, obj, act)
  if ok {
    fmt.Printf("%s CAN %s %s\n", sub, act, obj)
  } else {
    fmt.Printf("%s CANNOT %s %s\n", sub, act, obj)
  }
}

func main() {
  a, _ := gormadapter.NewAdapter("mysql", "root:12345@tcp(127.0.0.1:3306)/")
  e, _ := casbin.NewEnforcer("./model.conf", a)

  check(e, "dajun", "data1", "read")
  check(e, "lizi", "data2", "write")
  check(e, "dajun", "data1", "write")
  check(e, "dajun", "data2", "read")
}
```

运行：

```bash

dajun CAN read data1
lizi CAN write data2
dajun CANNOT write data1
dajun CANNOT read data2

```

## 使用函数

我们可以在匹配器中使用函数。casbin内置了一些函数keyMatch/keyMatch2/keyMatch3/keyMatch4都是匹配 URL 路径的，regexMatch使用正则匹配，ipMatch匹配 IP 地址。参见https://casbin.org/docs/en/function。使用内置函数我们能很容易对路由进行权限划分：


```ini
[matchers]
m = r.sub == p.sub && keyMatch(r.obj, p.obj) && r.act == p.act
```

```bash

p, dajun, user/dajun/*, read
p, lizi, user/lizi/*, read

```

不同用户只能访问其对应路由下的 URL：

```go
func main() {
  e, err := casbin.NewEnforcer("./model.conf", "./policy.csv")
  if err != nil {
    log.Fatalf("NewEnforecer failed:%v\n", err)
  }

  check(e, "dajun", "user/dajun/1", "read")
  check(e, "lizi", "user/lizi/2", "read")
  check(e, "dajun", "user/lizi/1", "read")
}
```

输出:

```bash

dajun CAN read user/dajun/1
lizi CAN read user/lizi/2
dajun CANNOT read user/lizi/1

```

我们当然也可以定义自己的函数。先定义一个函数，返回 bool：

```go
func KeyMatch(key1, key2 string) bool {
  i := strings.Index(key2, "*")
  if i == -1 {
    return key1 == key2
  }

  if len(key1) > i {
    return key1[:i] == key2[:i]
  }

  return key1 == key2[:i]
}
```

这里实现了一个简单的正则匹配，只处理*


然后将这个函数用interface{}类型包装一层：


```go
func KeyMatchFunc(args ...interface{}) (interface{}, error) {
  name1 := args[0].(string)
  name2 := args[1].(string)

  return (bool)(KeyMatch(name1, name2)), nil
}
```

接着，我们可以将添加的函数添加到权限认证器中：

```go
e.AddFunction("my_func", KeyMatchFunc)
```

这样我们就可以在匹配器中使用该函数实现正则匹配了：

```ini
[matchers]
m = r.sub == p.sub && my_func(r.obj, p.obj) && r.act == p.act
```

接下来我们在策略文件中为dajun赋予权限：

```csv
p, dajun, data/*, read
```

dajun对匹配模式data/*的文件都有read权限。

验证一下：

```go
check(e, "dajun", "data/1", "read")
check(e, "dajun", "data/2", "read")
check(e, "dajun", "data/1", "write")
check(e, "dajun", "mydata", "read")
```

结果如下：

```bash
dajun CAN read data/1
dajun CAN read data/2
dajun CANNOT write data/1
dajun CANNOT read mydata
```

需要注意的是，dajun对data/1没有write权限，mydata不符合data/*模式，也没有read权限。

## 参考

[go-每日一库-casbin](https://github.com/darjun/go-daily-lib/tree/master/casbin)
[使用casbin不错的参考模版项目-简单模版端](https://github.com/qifengzhang007/GinSkeleton)
[使用casbin不错的参考模版项目-包含业务端](https://github.com/qifengzhang007/ginskeleton-admin2-backend)






