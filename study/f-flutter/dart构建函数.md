# dart 构造函数

dart的构建函数和其它语言有些区别

## 1.  默认构造函数

如果没有显式定义构造函数，Dart 会自动生成一个默认的无参数构造函数。当想要创建类实例时，可以直接调用默认构造函数

```dart
class Person {
  // 默认构造函数会自动生成
}

void main() {
  var person = Person(); // 调用默认构造函数
}

```

## 2. 自定义构造函数

用来初始化类的实例变量或执行其他初始化任务。构造函数与类名相同

```dart
class Person {
  String name;
  int age;

  // 自定义构造函数
  Person(String name, int age) {
    this.name = name;
    this.age = age;
  }

  void displayInfo() {
    print('Name: $name, Age: $age');
  }
}

void main() {
  var person = Person('Alice', 30); // 调用自定义构造函数
  person.displayInfo(); // 输出: Name: Alice, Age: 30
}
```

## 3. 简写构造函数

如果构造函数的参数与实例变量名相同，可以使用简写形式

```dart
class Person {
  String name;
  int age;

  // 简写的构造函数
  Person(this.name, this.age);
}

void main() {
  var person = Person('Bob', 25);
  print('Name: ${person.name}, Age: ${person.age}');
}

```

## 4. 命名式构造函数

Dart 支持命名构造函数，允许为类**定义多个构造函数**。通过命名构造函数提供**不同的实例化方式**。
**动态选择构造函数**

```dart
class Point {
  double x;
  double y;

  // 默认构造函数
  Point(this.x, this.y);

  // 命名构造函数
  Point.origin() {
    x = 0;
    y = 0;
  }

  void display() {
    print('Point($x, $y)');
  }
}

void main() {
  var p1 = Point(3, 4); // 使用默认构造函数
  var p2 = Point.origin(); // 使用命名构造函数
  p1.display(); // 输出: Point(3.0, 4.0)
  p2.display(); // 输出: Point(0.0, 0.0)
}
```

## 5. 常量构造函数

类的**所有属性都是 final（不可变的）**，你可以定义一个常量构造函数
使用 const 关键字修饰的构造函数，可以创建编译时常量对象。这些对象在内存中可以被重用，减少内存消耗。

```dart
class ImmutablePoint {
  final double x;
  final double y;

  // 常量构造函数
  const ImmutablePoint(this.x, this.y);
}

void main() {
  const p1 = ImmutablePoint(1.0, 2.0);
  const p2 = ImmutablePoint(1.0, 2.0);

  print(p1 == p2); // 输出: true，p1 和 p2 指向相同的对象
}
```

## 6. 重定向构造函数

在构造函数中**重定向到同一个类中的另一个构造函数**，简化初始化逻辑

```dart
class Rectangle {
  double width;
  double height;

  // 默认构造函数
  Rectangle(this.width, this.height);

  // 重定向构造函数，正方形特殊情况
  // 重定向构造函数，用于创建正方形
  // 该构造函数接收一个大小参数，并将宽度和高度设置为相同的值
  Rectangle.square(double size) : this(size, size);
}

void main() {
  var rect1 = Rectangle(5, 10); // 默认构造函数
  var rect2 = Rectangle.square(7); // 重定向构造函数

  print('rect1: ${rect1.width}, ${rect1.height}'); // rect1: 5.0, 10.0
  print('rect2: ${rect2.width}, ${rect2.height}'); // rect2: 7.0, 7.0
}
```

## 7. 工厂构造函数

factory 构造函数并不像普通构造函数那样总是创建新实例，而是根据需要返回现有实例或其他类型的实例。工厂构造函数的典型用途是实现单例模式或缓存某些对象。

```dart
class Logger {
  final String name;
  static final Map<String, Logger> _cache = <String, Logger>{};

  // 私有构造函数
  Logger._internal(this.name);

  // 工厂构造函数
  factory Logger(String name) {
    if (_cache.containsKey(name)) {
      return _cache[name]!;
    } else {
      final logger = Logger._internal(name);
      _cache[name] = logger;
      return logger;
    }
  }
}

void main() {
  var logger1 = Logger('UI');
  var logger2 = Logger('UI');
  
  print(logger1 == logger2); // 输出: true，同一个实例
}

```

## 8. 私有构造函数

通过将构造函数命名为私有（使用下划线 _ 开头），可以限制类的实例化只能在类的内部进行

```dart
class Singleton {
  // 私有构造函数
  Singleton._internal();

  static final Singleton _instance = Singleton._internal();

  // 工厂构造函数，返回单例
  factory Singleton() {
    return _instance;
  }
}

void main() {
  var s1 = Singleton();
  var s2 = Singleton();

  print(s1 == s2); // 输出: true，s1 和 s2 是同一个实例
}
```

## 9. 初始化列表

构造函数可以包含初始化列表，用于在构造函数体之前初始化实例变量。这对于 final 变量或父类的初始化非常有用。

```dart
class Person {
  final String name;
  final int age;

  // 使用初始化列表
  Person(String name, int age) : name = name, age = age;

  void display() {
    print('Name: $name, Age: $age');
  }
}

void main() {
  var person = Person('Alice', 30);
  person.display(); // 输出: Name: Alice, Age: 30
}
```

## 10. 父类的构造函数调用

子类构造函数可以调用父类的构造函数，Dart 会自动调用父类的无参数构造函数。如果需要调用带参数的父类构造函数，可以使用初始化列表的语法。

```dart
class Animal {
  String name;

  Animal(this.name);
}

class Dog extends Animal {
  int age;

  // 使用初始化列表调用父类构造函数
  Dog(String name, this.age) : super(name);

  void display() {
    print('Dog: $name, Age: $age');
  }
}

void main() {
  var dog = Dog('Buddy', 4);
  dog.display(); // 输出: Dog: Buddy, Age: 4
}

```
