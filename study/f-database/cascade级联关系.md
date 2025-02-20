# cascade级联关系

让我详细解释 SQLAlchemy 中的级联关系（cascade）选项：

### 1. 基本级联选项

1. **save-update**（默认开启）

```python
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    posts = relationship("Post", cascade="save-update")
```

- 当父对象被添加到会话时，相关的子对象也会被添加
- 适用于需要同时保存关联对象的场景

2. **delete**

```python
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    posts = relationship("Post", cascade="delete")
```

- 当删除父对象时，相关的子对象也会被删除
- 不会删除孤儿对象（与父对象解除关联的子对象）
- 解除关联的时候不会删除子对象
  - 父向子解除关联的方式: user.posts.remove(post)
  - 子向父解除关联的方式: post.user = None

1. **delete-orphan**

```python
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    posts = relationship("Post", cascade="delete-orphan")
```

- 删除与父对象解除关联的子对象
- 只能用于一对多关系

4. **merge**

```python
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    posts = relationship("Post", cascade="merge")
```

- 当合并父对象时，相关的子对象也会被合并
- 用于处理分离对象的状态同步

5. **refresh-expire**

```python
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    posts = relationship("Post", cascade="refresh-expire")
```

- 当刷新/过期父对象时，相关的子对象也会被刷新/过期
- 用于保持对象状态的一致性

6. **expunge**

```python
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    posts = relationship("Post", cascade="expunge")
```

- 当从会话中移除父对象时，相关的子对象也会被移除

### 2. 常用组合

1. **all**

```python
relationship("Post", cascade="all")
```

- 包含：save-update、merge、refresh-expire、expunge、delete
- 不包含：delete-orphan

2. **all, delete-orphan**

```python
relationship("Post", cascade="all, delete-orphan")
```

- 最常用的组合
- 包含所有级联操作，并且会删除孤儿对象

### 3. 实际应用示例

```python
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    
    # 一对多关系，完全级联
    posts = relationship(
        "Post",
        cascade="all, delete-orphan",
        back_populates="user"
    )
    
    # 多对多关系，不包含 delete-orphan
    tags = relationship(
        "Tag",
        secondary="user_tags",
        cascade="all",
        back_populates="users"
    )

class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String)
    
    # 仅删除级联
    user = relationship(
        "User",
        # 非必要表明delete关系也可以
        cascade="delete",
        back_populates="posts"
    )
```

### 4. 使用建议

1. **一对多关系**：
   - 通常使用 `"all, delete-orphan"`
   - 确保完整的数据完整性

2. **多对多关系**：
   - 使用 `"all"`
   - 不能使用 delete-orphan

3. **只读关系**：
   - 可以使用 `"refresh-expire"`
   - 避免不必要的级联操作
