
# acl权限模型的继承方案

```python:/examples/acl_inheritance.py
from enum import Flag, auto
from typing import Dict, Set

class Permission(Flag):
    NONE = 0
    READ = auto()      # 读权限
    WRITE = auto()     # 写权限
    EXECUTE = auto()   # 执行权限
    ADMIN = auto()     # 管理权限
    
    # 预定义的权限组合
    READ_WRITE = READ | WRITE
    FULL = READ | WRITE | EXECUTE | ADMIN

class ACL:
    def __init__(self):
        self.user_permissions: Dict[str, Permission] = {}  # 用户直接权限
        self.group_permissions: Dict[str, Permission] = {}  # 组权限
        self.user_groups: Dict[str, Set[str]] = {}  # 用户所属组
        
    def add_user_to_group(self, user: str, group: str):
        if user not in self.user_groups:
            self.user_groups[user] = set()
        self.user_groups[user].add(group)
        
    def set_user_permission(self, user: str, permission: Permission):
        self.user_permissions[user] = permission
        
    def set_group_permission(self, group: str, permission: Permission):
        self.group_permissions[group] = permission
        
    def get_effective_permission(self, user: str) -> Permission:
        # 1. 首先获取用户直接权限
        effective_permission = self.user_permissions.get(user, Permission.NONE)
        
        # 2. 合并用户所属组的权限
        if user in self.user_groups:
            for group in self.user_groups[user]:
                group_permission = self.group_permissions.get(group, Permission.NONE)
                effective_permission |= group_permission
                
        return effective_permission

# 使用示例
def main():
    acl = ACL()
    
    # 设置组权限
    acl.set_group_permission("developers", Permission.READ_WRITE)
    acl.set_group_permission("admins", Permission.FULL)
    
    # 设置用户所属组
    acl.add_user_to_group("alice", "developers")
    acl.add_user_to_group("bob", "developers")
    acl.add_user_to_group("bob", "admins")
    
    # 设置用户直接权限
    acl.set_user_permission("alice", Permission.EXECUTE)
    
    # 检查最终权限
    alice_permission = acl.get_effective_permission("alice")
    bob_permission = acl.get_effective_permission("bob")
    
    print(f"Alice's permissions: {alice_permission}")
    print(f"Bob's permissions: {bob_permission}")
    
if __name__ == "__main__":
    main()
```

让我详细解释这个 ACL 实现的关键点：

### 1. 权限定义
- 使用 `Flag` 枚举类型定义基本权限：READ、WRITE、EXECUTE、ADMIN
- 权限可以组合，使用位运算符 `|` 组合多个权限
- 预定义了常用的权限组合如 READ_WRITE 和 FULL

### 2. 权限初始化和分配
1. **用户直接权限**：
   - 通过 `set_user_permission()` 直接给用户分配权限
   - 存储在 `user_permissions` 字典中

2. **组权限**：
   - 通过 `set_group_permission()` 给组分配权限
   - 存储在 `group_permissions` 字典中

3. **用户组关系**：
   - 通过 `add_user_to_group()` 将用户添加到组
   - 一个用户可以属于多个组
   - 存储在 `user_groups` 字典中

### 3. 权限优先级和继承规则
1. **基本原则**：权限采用"累加"规则，即最终权限是所有适用权限的并集

2. **权限计算顺序**：
   - 首先获取用户的直接权限
   - 然后获取用户所属所有组的权限
   - 使用位运算符 `|` 合并所有权限

3. **优先级处理**：
   - 由于采用权限并集的方式，较高的权限会自然覆盖较低的权限
   - 如果需要实现权限的"拒绝"机制，可以添加显式的 DENY 标志

### 4. 最终权限确定
通过 `get_effective_permission()` 方法确定用户的最终权限：
1. 获取用户直接权限（如果没有则为 NONE）
2. 获取用户所属所有组的权限
3. 合并所有权限得到最终结果

### 使用示例解释
```python
# Alice 的权限：
# - 直接权限：EXECUTE
# - 组权限：READ_WRITE (来自 developers 组)
# 最终权限：READ | WRITE | EXECUTE

# Bob 的权限：
# - 直接权限：无
# - 组权限：READ_WRITE (来自 developers 组) 和 FULL (来自 admins 组)
# 最终权限：READ | WRITE | EXECUTE | ADMIN
```

这个实现可以根据需求进行扩展，例如：
1. 添加权限拒绝机制
2. 实现权限继承的优先级控制
3. 添加角色基础的访问控制（RBAC）
4. 实现更细粒度的权限控制

## 最终举例

```py
from enum import Flag, auto
from typing import Dict, Set, List
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

Base = declarative_base()

# 用户-组关联表（多对多关系）
user_groups = Table(
    'user_groups', 
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('group_id', Integer, ForeignKey('groups.id'))
)

class Permission(Flag):
    NONE = 0
    READ = auto()
    WRITE = auto()
    EXECUTE = auto()
    ADMIN = auto()
    
    READ_WRITE = READ | WRITE
    FULL = READ | WRITE | EXECUTE | ADMIN

# 数据库模型定义
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    direct_permission = Column(Integer, default=0)  # 存储权限的整数值
    
    # 关联关系
    groups = relationship('Group', secondary=user_groups, back_populates='users')

class Group(Base):
    __tablename__ = 'groups'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    permission = Column(Integer, default=0)  # 存储权限的整数值
    
    # 关联关系
    users = relationship('User', secondary=user_groups, back_populates='groups')

class ACLDB:
    def __init__(self, db_url='sqlite:///acl.db'):
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    def add_user(self, username: str) -> User:
        user = User(username=username)
        self.session.add(user)
        self.session.commit()
        return user
    
    def add_group(self, group_name: str) -> Group:
        group = Group(name=group_name)
        self.session.add(group)
        self.session.commit()
        return group
    
    def add_user_to_group(self, username: str, group_name: str):
        user = self.session.query(User).filter_by(username=username).first()
        group = self.session.query(Group).filter_by(name=group_name).first()
        if user and group:
            user.groups.append(group)
            self.session.commit()
    
    def set_user_permission(self, username: str, permission: Permission):
        user = self.session.query(User).filter_by(username=username).first()
        if user:
            user.direct_permission = permission.value
            self.session.commit()
    
    def set_group_permission(self, group_name: str, permission: Permission):
        group = self.session.query(Group).filter_by(name=group_name).first()
        if group:
            group.permission = permission.value
            self.session.commit()
    
    def get_effective_permission(self, username: str) -> Permission:
        user = self.session.query(User).filter_by(username=username).first()
        if not user:
            return Permission.NONE
            
        # 获取用户直接权限
        effective_permission = Permission(user.direct_permission)
        
        # 合并用户所属组的权限
        for group in user.groups:
            group_permission = Permission(group.permission)
            effective_permission |= group_permission
            
        return effective_permission

# 使用示例
def main():
    acl = ACLDB()
    
    # 创建用户和组
    acl.add_user("alice")
    acl.add_user("bob")
    acl.add_group("developers")
    acl.add_group("admins")
    
    # 设置权限
    acl.set_group_permission("developers", Permission.READ_WRITE)
    acl.set_group_permission("admins", Permission.FULL)
    acl.set_user_permission("alice", Permission.EXECUTE)
    
    # 添加用户到组
    acl.add_user_to_group("alice", "developers")
    acl.add_user_to_group("bob", "developers")
    acl.add_user_to_group("bob", "admins")
    
    # 检查权限
    alice_permission = acl.get_effective_permission("alice")
    bob_permission = acl.get_effective_permission("bob")
    
    print(f"Alice's permissions: {alice_permission}")
    print(f"Bob's permissions: {bob_permission}")

if __name__ == "__main__":
    main()
```