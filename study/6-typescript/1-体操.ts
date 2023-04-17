namespace TS {
  type MyPick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  type User = {
    id: number;
    name: string;
    address: string;
  };

  type UserKeyof = keyof User;
  // type PickedUser = {
  //     id: number;
  //     name: string;
  // }

  type PickedUser = MyPick<User, "id" | "name">;

  // 返回promise的类型
  type Unpacked<T> = T extends Promise<infer R> ? R : T;

  type Ids = number[];
  type func = () => number;

  /**
   * 给对象类型添加新的属性
   */

  type AppendToObject<T, U extends keyof any, V> = {
    [P in keyof T | U]: P extends keyof T ? T[P] : V;
  };

  type KEY = keyof any; // string | number | symbol

  type appendToObject1<T, U extends keyof any, V> = {
    [P in keyof T | U]: P extends keyof T ? T[P] : V;
  };

  /**
   * 去除对象中的某个属性
   */
  type MyOmit<T, K> = { [P in keyof T as P extends K ? never : P]: T[P] };

  type MyOmit1<T, K> = { [P in keyof T as P extends K ? never : P]: T[P] };

  /**
   * Exclude 差集
   * T满足约束T，使用T
   */

  type MyExclude<T, K> = T extends K ? never : T;

  /**
   * Extract  交集
   */

  type MyExtract<T, K> = T extends K ? T : never;

  /**
   * NonNullable
   */
  type MyNonNullable1<T> = T extends null | undefined ? never : T;

  /**
   * Partial
   * Partial<T>返回一个包含所有T的子集的type。
   */

  type MyPartial<T> = {
    [P in keyof T]?: T[P];
  };

  /**
   * Required
   * 和Partial<T>正好相反， Required<T>会将所有的属性设为required。
   */

  type MyRequired<T> = {
    [P in keyof T]-?: T[P];
  };

  /**
   * Readonly
   */
  type MyReadonly<T> = {
    readonly [P in keyof T]: T[P];
  };

  /**
   * Record
   *
   */
  type keyOfAny = keyof any;
  type MyRecord<K extends keyof any, T> = {
    [P in K]: T;
  };

  type Key = "a" | "b" | "c";
  type a = Record<Key, string>;

  /**
   * Parameters
   * 对于function type T， Parameters<T> 返回一个由其参数type组成的tuple type。
   */

  type MyParameters<T extends (...args: any[]) => any> = T extends (
    ...args: infer P
  ) => any
    ? P
    : never;

  /**
   * ConstructorParameters
   * 构造函数参数
   */

  type MyConstructorParameters<T extends new (...args: any) => any> =
    T extends new (...args: infer P) => any ? P : never;

  /**
   *  InstanceType 返回其instance type
   */

  type MyInstanceType<T extends new (...args: any) => any> = T extends new (
    ...args: any[]
  ) => infer P
    ? P
    : any;
  /**
   * ReturnType  获取函数返回值的类型
   */
  type MyReturnType<T> = T extends (...argus: any[]) => infer R ? R : any;
  type ReturnType1 = MyReturnType<func>;

  /**
   * ThisParameterType
   * 返回this的类型
   */
  type MyThisParameterType<T> = T extends (this: infer P, ...args: any) => any
    ? P
    : unknown;

  /**
   * OmitThisParameter
   * Function.prototype.bind()返回一个this已经bind过后的function。 对于这种情况，可以用OmitThisParameter<T>来增加type信息。
   */
  type MyOmitThisParameter<T> = unknown;

  function foo(this: { a: string }) {}

  // foo() // Error

  const bar = foo.bind({ a: "BFE.dev" });
  bar(); // OK

  type Foo = (this: { a: string }) => string;
  type Bar = MyOmitThisParameter<Foo>; // () => string

  /**
   * IsNever
   *
   */

  type IsNever<t> = [T] extends [never] ? true : false;
}