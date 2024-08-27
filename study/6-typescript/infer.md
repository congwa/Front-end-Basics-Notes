# infer

通常与泛型和 extends 关键字一起使用

```ts
type Moment<T> = T extends infer U ? U : never;
```

T extends infer U 意味着我们试图推断类型 T 并将其赋值给 U。如果类型推断成功，那么 U 就是我们推断出的类型

```ts
type Moment<T> = T extends infer U ? U : never;

type StringType = Moment<string>; // string
type NumberType = Moment<number>; // number
type UnionType = Moment<string | number>; // string | number

interface User {
  name: string;
  age: number;
}

type UserType = Moment<User>; // User

// Moment<T> 实际上只是返回了 T 的类型，不进行任何转换或处理
```

## 常见例子

### 1. 提取函数返回类型

```ts
// (...args: any[]) 表示该函数可以接受任意数量的参数
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type ExampleFunction = (x: number, y: string) => boolean;
// infer R: 如果 T 是一个函数类型，那么 infer R 将推断出函数的返回值类型，并将其赋给类型变量 R
type ReturnTypeOfExampleFunction = GetReturnType<ExampleFunction>; // boolean

```


### 2. 提取元素类型

```ts
type GetArrayElementType<T> = T extends (infer U)[] ? U : never;

type Moment = string[];
type Example1Array = Array<string>;

type ElementTypeOfExampleArray = GetArrayElementType<Moment>; // string
type ElementTypeOfExample1Array = GetArrayElementType<Example1Array>; //string
// 使用 T extends (infer U)[] 来推断数组元素的类型 U。其中 T 是 string[]，U 是 string[] 中的是 string

/// infer 声明仅在条件类型的 extends 子句中才允许使用，并且 infer 声明的类型变量只有在 true 分支中可用
```

### 3. 提取Promise的值类型

```ts
type GetPromiseValueType<T> = T extends Promise<infer U> ? U : never;

// 示例
type ExamplePromise = Promise<number>;
type ValueTypeOfExamplePromise = GetPromiseValueType<ExamplePromise>; // number

```

### 4. 提取函数参数类型

```ts
type GetParameters<T> = T extends (...args: infer P) => any ? P : never;

type ExampleFunction = (a: number, b: string) => void;
type Params = GetParameters<ExampleFunction>; // [number, string]

```

### 5. 提取构造函数参数类型

```ts
type ConstructorParameters<T> = T extends new (...args: infer P) => any
  ? P
  : never;

class ExampleClass {
  constructor(public a: number, public b: string) {}
}

type Params = ConstructorParameters<typeof ExampleClass>; // [number, string]

```


### 6. 条件类型中的复杂判断

```ts
type IsArray<T> = T extends (infer U)[] ? U : never;
type IsFunction<T> = T extends (...args: any[]) => infer R ? R : never;

type ExtractType<T> = T extends any[]
  ? IsArray<T>
  : T extends (...args: any[]) => any
  ? IsFunction<T>
  : T;

// 示例
type ArrayType = ExtractType<string[]>; // string
type FunctionReturnType = ExtractType<() => number>; // number
type DefaultType = ExtractType<boolean>; // boolean

```

主要是从一个类型中提取想要的类型


