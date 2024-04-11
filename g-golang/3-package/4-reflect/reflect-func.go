func Add(a, b int) int {
	return a + b
}

func Greeting(name string) string {
	return "hello " + name
}

func invoke(f interface{}, args ...interface{}) {
	v := reflect.ValueOf(f)

	argsV := make([]reflect.Value, 0, len(args))
	for _, arg := range args {
		argsV = append(argsV, reflect.ValueOf(arg))
	}

	rets := v.Call(argsV)

	fmt.Println("ret:")
	for _, ret := range rets {
		fmt.Println(ret.Interface())
	}
}

func main() {
	invoke(Add, 1, 2)
	invoke(Greeting, "dj")
}

// ret:
// 3
// ret:
// hello dj