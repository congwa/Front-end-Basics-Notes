# SQLAlchemy 使用指南

## 1. 基础配置

```py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 创建数据库引擎
engine = create_engine(DATABASE_URL)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建声明性基类
Base = declarative_base()
```

## 2. 模型定义

```py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    name = Column(String(50))
    posts = relationship("Post", back_populates="author")
```

## 3. 数据库操作

### 3.1 基本 CRUD 操作

```python
# 创建
def create_user(db: Session, email: str, name: str):
    user = User(email=email, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# 查询
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

# 更新
def update_user(db: Session, user_id: int, name: str):
    user = get_user(db, user_id)
    user.name = name
    db.commit()
    return user

# 删除
def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    db.delete(user)
    db.commit()
```

### 3.2 高级查询

```python
# 联接查询
users = db.query(User).join(Post).filter(Post.title.contains('python')).all()

# 分组和聚合
from sqlalchemy.func import count
post_counts = db.query(User, count(Post.id)).join(Post).group_by(User.id).all()

# 复杂过滤
from sqlalchemy import or_
users = db.query(User).filter(
    or_(User.name == 'Alice', User.name == 'Bob')
).order_by(User.name.desc()).all()
```

## 4. 数据库迁移（使用 Alembic）

### 4.1 初始化和创建迁移

```bash
# 初始化 Alembic
alembic init alembic

# 创建迁移脚本
alembic revision --autogenerate -m "create_users_table"

# 执行迁移
alembic upgrade head
```

### 4.2 常见迁移操作

```python:/Users/cong/code/my/fask-graphrag/alembic/versions/xxxxxxxxxxxx_migration.py
def upgrade():
    # 添加新列
    op.add_column('users', sa.Column('age', sa.Integer(), server_default='18'))
    
    # 删除列
    op.drop_column('users', 'old_column')
    
    # 修改列类型
    op.alter_column('users', 'column_name',
                    type_=sa.String(100),
                    existing_type=sa.String(50))
    
    # 重命名列
    op.alter_column('users', 'old_name', new_column_name='new_name')

def downgrade():
    # 回滚操作
    op.alter_column('users', 'new_name', new_column_name='old_name')
    op.alter_column('users', 'column_name',
                    type_=sa.String(50),
                    existing_type=sa.String(100))
    op.add_column('users', sa.Column('old_column', sa.String(50)))
    op.drop_column('users', 'age')
```

## 5. 性能优化

### 5.1 查询优化

```python
# 延迟加载
class User(Base):
    posts = relationship("Post", lazy="dynamic")

# 预加载
users = db.query(User).options(joinedload(User.posts)).all()
```

### 5.2 批量操作

```python
# 批量插入
db.bulk_insert_mappings(User, [
    {"name": "user1", "email": "user1@example.com"},
    {"name": "user2", "email": "user2@example.com"}
])
```

## 6. 注意事项

1. 生产环境中使用 Alembic 进行架构变更
2. 重要操作前进行数据备份
3. 大表操作选择在低峰期执行
4. 添加新列时考虑默认值和空值处理
5. 删除列时注意外键依赖
6. 定期优化数据库性能

## 操作

1. **创建表和重复运行创建表语句**：

```python
# 方法一：使用 Base.metadata.create_all()
Base.metadata.create_all(bind=engine)  # 安全的，已存在的表会被跳过
```

重复运行的结果：

- 如果表不存在，则创建表
- 如果表已存在，则跳过，不会修改现有表
- 不会更新已存在表的结构（比如新增的列不会被添加）

2. **在已有数据的表中修改结构**：

推荐使用 Alembic 进行数据库迁移：

```bash
# 1. 初始化 Alembic（如果还没初始化）
alembic init alembic

# 2. 生成迁移脚本
alembic revision --autogenerate -m "add_new_column"
```

然后在生成的迁移脚本中：

```python:/Users/cong/code/my/fask-graphrag/alembic/versions/xxxxxxxxxxxx_add_new_column.py
def upgrade():
    # 添加新列（带默认值）
    op.add_column('users', sa.Column('age', sa.Integer(), server_default='18'))
    
    # 添加新列（允许为空）
    op.add_column('users', sa.Column('address', sa.String(100), nullable=True))
    
    # 删除列
    op.drop_column('users', 'old_column')
    
    # 添加带计算的默认值
    op.add_column('users', 
        sa.Column('created_at', sa.DateTime, 
                 server_default=sa.text('CURRENT_TIMESTAMP')))

def downgrade():
    # 回滚操作（按相反顺序）
    op.drop_column('users', 'created_at')
    op.add_column('users', sa.Column('old_column', sa.String(50)))
    op.drop_column('users', 'address')
    op.drop_column('users', 'age')
```

执行迁移：

```bash
# 执行迁移
alembic upgrade head

# 如果需要回滚
alembic downgrade -1
```

一些高级操作示例：

```python
def upgrade():
    # 1. 重命名列
    op.alter_column('users', 'old_name', new_column_name='new_name')
    
    # 2. 修改列类型
    op.alter_column('users', 'column_name',
                    type_=sa.String(100),
                    existing_type=sa.String(50))
    
    # 3. 添加带条件的默认值
    op.add_column('users',
        sa.Column('status',
                 sa.String(20),
                 server_default=sa.case(
                     [(sa.column('age') >= 18, 'adult')],
                     else_='minor'
                 )))
    
    # 4. 批量更新数据
    connection = op.get_bind()
    connection.execute(
        "UPDATE users SET new_column = 'default' WHERE new_column IS NULL"
    )
```

注意事项：

1. 在生产环境中始终使用 Alembic 进行架构变更
2. 重要操作前要备份数据
3. 添加新列时考虑：
   - 是否需要默认值
   - 是否允许为空
   - 是否需要索引
4. 删除列时注意：
   - 是否有外键引用
   - 是否有依赖的视图或触发器
5. 大表操作注意：
   - 选择在低峰期执行
   - 考虑分批处理
   - 监控数据库性能
