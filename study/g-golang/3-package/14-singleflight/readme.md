# SingleFlight

`singleflight` 来源于准官方库`golang.org/x/sync/singleflight`，能够在抑制对下游的多次重复请求.主要提供了以下三个方法：

```go
// Do():  相同的 key，fn 同时只会执行一次，返回执行的结果给fn执行期间，所有使用该 key 的调用
// v: fn 返回的数据
// err: fn 返回的err
// shared: 表示返回数据是调用 fn 得到的还是其他相同 key 调用返回的
func (g *Group) Do(key string, fn func() (interface{}, error)) (v interface{}, err error, shared bool) {
// DoChan(): 类似Do方（），以 chan 返回结果
func (g *Group) DoChan(key string, fn func() (interface{}, error)) <-chan Result {
// Forget(): 失效 key，后续对此 key 的调用将执行 fn，而不是等待前面的调用完成
func (g *Group) Forget(key string)
```

## 使用场景 - 防止缓存击穿

一般情况下我们在写一写对外的服务的时候都会有一层 `cache` 作为缓存，用来减少底层数据库的压力，但是在遇到例如 redis 抖动或者其他情况可能会导致大量的 `cache miss` 出现。

这个库的主要作用就是将一组相同的请求合并成一个请求，实际上只会去请求一次，然后对所有的请求返回相同的结果

使用 `singleflight` 之后，我们在一个请求的时间周期内实际上只会向底层的数据库发起一次请求大大减少对数据库的压力

```go
package main

import (
	"errors"
	"log"
	"sync"

	"golang.org/x/sync/singleflight"
)

var errorNotExist = errors.New("not exist")
func main() {
	var wg sync.WaitGroup
	wg.Add(10)

	//模拟10个并发
	for i := 0; i < 10; i++ {
		go func() {
			defer wg.Done()
			data, err := getData("key")
			if err != nil {
				log.Print(err)
				return
			}
			log.Println(data)
		}()
	}
	wg.Wait()
}

//获取数据
func getData(key string) (string, error) {
	data, err := getDataFromCache(key)
	if err == errorNotExist {
		//模拟从db中获取数据
		data, err = getDataFromDB(key)
		if err != nil {
			log.Println(err)
			return "", err
		}

		//TOOD: set cache
	} else if err != nil {
		return "", err
	}
	return data, nil
}

//模拟从cache中获取值，cache中无该值
func getDataFromCache(key string) (string, error) {
	return "", errorNotExist
}

//模拟从数据库中获取值
func getDataFromDB(key string) (string, error) {
	log.Printf("get %s from database", key)
	return "data", nil
}

// 缓存中始终没有该值，一直在db中取，缓存击穿现象
```

```go
// 使用singleflight改造
import "golang.org/x/sync/singleflight"

var gsf singleflight.Group

//获取数据
func getData(key string) (string, error) {
	data, err := getDataFromCache(key)
	if err == errorNotExist {
		//模拟从db中获取数据
		v, err, _ := gsf.Do(key, func() (interface{}, error) {
			return getDataFromDB(key)
			//set cache
		})
		if err != nil {
			log.Println(err)
			return "", err
		}

		//TOOD: set cache
		data = v.(string)
	} else if err != nil {
		return "", err
	}
	return data, nil
}

// 只有一个请求进入的db，其他的请求也正常返回了值，从而保护了后端DB。
```

## 实现原理

TODO: singleflight实现原理

[七天用Go从零实现系列-分布式防止缓存击穿](https://geektutu.com/post/geecache-day6.html)