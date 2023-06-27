type User struct {
	Name    string
	Age     int
	Married bool
}

func inspectStruct(u interface{}) {
	v := reflect.ValueOf(u)
	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		switch field.Kind() {
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			fmt.Printf("field:%d type:%s value:%d\n", i, field.Type().Name(), field.Int())

		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			fmt.Printf("field:%d type:%s value:%d\n", i, field.Type().Name(), field.Uint())

		case reflect.Bool:
			fmt.Printf("field:%d type:%s value:%t\n", i, field.Type().Name(), field.Bool())

		case reflect.String:
			fmt.Printf("field:%d type:%s value:%q\n", i, field.Type().Name(), field.String())

		default:
			fmt.Printf("field:%d unhandled kind:%s\n", i, field.Kind())
		}
	}
}

func main() {
	u := User{
		Name:    "dj",
		Age:     18,
		Married: true,
	}

	inspectStruct(u)
}