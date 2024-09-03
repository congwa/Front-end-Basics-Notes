# syncer 数据同步器


```go
// state 状态常量
const (
 Unchanged = 0
 Insert    = 1
 Update    = 2
 Delete    = 3
)

// New 函数创建一个新的 Syncer 实例，接收一组用于插入、删除、更新、UUID生成、相等比较和通知更改的函数。
// 如果任何必要的函数为空，将会触发 panic。
func New[T any, V comparable](
 insert func(ctx context.Context, value T) error,
 delete func(ctx context.Context, value T) error,
 update func(ctx context.Context, server T, local T) error,
 uuid func(value T) V,
 equal func(a T, b T) bool,
 notice func(ctx context.Context, state int, server, local T) error,
) *Syncer[T, V] {
 if insert == nil || update == nil || delete == nil || uuid == nil {
  panic("invalid params")  // 如果参数无效则抛出异常
 }
 var t T
 tof := reflect.TypeOf(&t)  // 获取数据类型
 for tof.Kind() == reflect.Ptr {
  tof = tof.Elem()  // 处理指针类型，获取实际数据类型
 }
 return &Syncer[T, V]{
  insert: insert,
  update: update,
  delete: delete,
  uuid:   uuid,
  equal:  equal,
  notice: notice,
  ts:     tof.String(),
 }
}

// Syncer 是一个通用的结构体，用于处理服务器数据和本地数据之间的同步操作。
// 它提供了一组方法来在同步过程中执行插入、更新、删除、比较和通知更改的操作。
type Syncer[T any, V comparable] struct {
 insert func(ctx context.Context, server T) error        // 插入新数据的函数
 update func(ctx context.Context, server T, local T) error // 更新已有数据的函数
 delete func(ctx context.Context, local T) error          // 删除数据的函数
 notice func(ctx context.Context, state int, server, local T) error // 通知更改的函数
 equal  func(server T, local T) bool                      // 比较两个数据项的函数
 uuid   func(value T) V                                   // 生成唯一标识符的函数
 ts     string                                            // 被同步数据的类型
}

// eq 方法使用提供的相等比较函数来比较两个数据项。
// 如果没有提供自定义函数，则使用 reflect.DeepEqual 进行深度比较。
func (s *Syncer[T, V]) eq(server T, local T) bool {
 if s.equal != nil {
  return s.equal(server, local)
 }
 return reflect.DeepEqual(server, local)
}

// onNotice 方法在同步过程中触发通知回调（如果可用），然后执行额外的函数（如果提供）。
// 用于在同步过程中处理通知。
func (s *Syncer[T, V]) onNotice(ctx context.Context, state int, server, local T, fn func(ctx context.Context, state int, server, local T) error) error {
 if s.notice != nil {
  if err := s.notice(ctx, state, server, local); err != nil {
   return err
  }
 }
 if fn != nil {
  if err := fn(ctx, state, server, local); err != nil {
   return err
  }
 }
 return nil
}

// Sync 方法通过执行插入、更新和删除操作，在服务器数据和本地数据之间进行同步。
// 同时处理更改的通知。如果 noDel 参数为 true，则跳过删除步骤。
func (s *Syncer[T, V]) Sync(ctx context.Context, serverData []T, localData []T, notice func(ctx context.Context, state int, server, local T) error, noDel ...bool) (err error) {
 defer func() {
  if err == nil {
   log.ZDebug(ctx, "sync success", "type", s.ts)
  } else {
   log.ZError(ctx, "sync failed", err, "type", s.ts)
  }
 }()
 if len(serverData) == 0 && len(localData) == 0 {
  log.ZDebug(ctx, "sync both the server and client are empty", "type", s.ts)
  return nil
 }
 localMap := make(map[V]T)  // 创建本地数据的映射表，用于快速查找
 for i, item := range localData {
  localMap[s.uuid(item)] = localData[i]  // 根据唯一标识符将本地数据放入映射表
 }
 for i := range serverData {
  server := serverData[i]
  id := s.uuid(server)
  local, ok := localMap[id]
  if !ok {  // 如果本地数据中没有找到对应的服务器数据
   if err := s.insert(ctx, server); err != nil {
    log.ZError(ctx, "sync insert failed", err, "type", s.ts, "server", server, "local", local)
    return err
   }
   if err := s.onNotice(ctx, Insert, server, local, notice); err != nil {
    log.ZError(ctx, "sync notice insert failed", err, "type", s.ts, "server", server, "local", local)
    return err
   }
   continue
  }
  delete(localMap, id)  // 移除已处理的数据
  if s.eq(server, local) {  // 如果数据相等
   if err := s.onNotice(ctx, Unchanged, local, server, notice); err != nil {
    log.ZError(ctx, "sync notice unchanged failed", err, "type", s.ts, "server", server, "local", local)
    return err
   }
   continue
  }
  if err := s.update(ctx, server, local); err != nil {  // 更新数据
   log.ZError(ctx, "sync update failed", err, "type", s.ts, "server", server, "local", local)
   return err
  }
  if s.ts == "model_struct.LocalUser" {
   log.ZDebug(ctx, "model_struct.LocalUser", "type", s.ts, "server", server, "local", local, "isEq", s.eq(server, local))
  }
  if err := s.onNotice(ctx, Update, server, local, notice); err != nil {
   log.ZError(ctx, "sync notice update failed", err, "type", s.ts, "server", server, "local", local)
   return err
  }
 }
 if len(noDel) > 0 && noDel[0] {
  return nil
 }
 for id := range localMap {  // 删除在服务器中已不存在的本地数据
  local := localMap[id]
  if err := s.delete(ctx, local); err != nil {
   log.ZError(ctx, "sync delete failed", err, "type", s.ts, "local", local)
   return err
  }
  var server T
  if err := s.onNotice(ctx, Delete, server, local, notice); err != nil {
   log.ZError(ctx, "sync notice delete failed", err, "type", s.ts, "local", local)
   return err
  }
 }
 return nil
}

```


用于在固定数据格式的不同list中进行数据同步，做出处理
