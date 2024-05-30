package main

import (
	"container/list" // 导入双向链表的包
	"fmt"
	"net/http"
	"sync"
)

func main() {
	// 创建 FlowControl 实例
	flowControl := NewFlowControl()
	// 创建 MyHandler 实例，并将 flowControl 赋值给其属性
	myHandler := MyHandler{
		flowControl: flowControl,
	}
	// 将 myHandler 注册为根路径的处理器
	http.Handle("/", &myHandler)

	// 启动 HTTP 服务监听端口为 8080
	http.ListenAndServe(":8080", nil)
}

type MyHandler struct {
	flowControl *FlowControl
}

// ServeHTTP 处理 HTTP 请求的函数
func (h *MyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fmt.Println("接收到 HTTP 请求")
	// 创建一个 Job 实例
	job := &Job{
		DoneChan: make(chan struct{}, 1), // 创建一个带缓冲的通道
		handleJob: func(job *Job) error { // 定义 handleJob 函数
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte("Hello World"))
			return nil
		},
	}

	// 提交任务至流量控制器
	h.flowControl.CommitJob(job)
	fmt.Println("提交任务至任务队列成功")
	job.WaitDone()
}

type FlowControl struct {
	jobQueue *JobQueue
	wm       *WorkerManager
}

// NewFlowControl 创建 FlowControl 实例
func NewFlowControl() *FlowControl {
	// 创建 JobQueue 实例，最大容量为 10
	jobQueue := NewJobQueue(10)
	fmt.Println("初始化任务队列成功")

	// 创建 WorkerManager 实例，并将 jobQueue 传入
	m := NewWorkerManager(jobQueue)
	m.createWorker()
	fmt.Println("初始化工作管理器成功")

	// 创建 FlowControl 实例，并将 jobQueue 和 wm 赋值给其属性
	control := &FlowControl{
		jobQueue: jobQueue,
		wm:       m,
	}
	fmt.Println("初始化流量控制成功")
	return control
}

// CommitJob 提交任务至任务队列
func (c *FlowControl) CommitJob(job *Job) {
	c.jobQueue.PushJob(job)
	fmt.Println("提交任务成功")
}

// Job 代表一个任务
type Job struct {
	DoneChan  chan struct{}      // 任务执行完成的通道
	handleJob func(j *Job) error // 执行任务的函数
}

// Done 任务执行完成，关闭通道
func (job *Job) Done() {
	job.DoneChan <- struct{}{}
	close(job.DoneChan)
}

// WaitDone 等待任务执行完成
func (job *Job) WaitDone() {
	select {
	case <-job.DoneChan:
		return
	}
}

// Execute 执行任务
func (job *Job) Execute() error {
	fmt.Println("开始执行任务")
	return job.handleJob(job)
}

// JobQueue 代表任务队列
type JobQueue struct {
	mu         sync.Mutex    // 互斥锁，保证并发安全
	noticeChan chan struct{} // 当有任务添加进来时通知 worker
	queue      *list.List    // 双向链表存储任务
	size       int           // 任务队列的长度
	capacity   int           // 任务队列的容量
}

// NewJobQueue 创建 JobQueue 实例
func NewJobQueue(cap int) *JobQueue {
	return &JobQueue{
		capacity:   cap,
		queue:      list.New(),
		noticeChan: make(chan struct{}, 1),
	}
}

// PushJob 将任务推入任务队列
func (q *JobQueue) PushJob(job *Job) {
	q.mu.Lock()
	defer q.mu.Unlock()

	// 如果任务队列已满，移除最早的任务
	if q.size > q.capacity {
		q.RemoveLeastJob()
	}

	// 将任务推入队列
	q.queue.PushBack(job)

	// 通知 worker 有新的任务
	q.noticeChan <- struct{}{}
}

// PopJob 从任务队列中取出任务
func (q *JobQueue) PopJob() *Job {
	q.mu.Lock()
	defer q.mu.Unlock()

	// 若队列为空，返回空值
	if q.size == 0 {
		return nil
	}

	// 从队列头部取出任务并返回
	q.size--
	return q.queue.Remove(q.queue.Front()).(*Job)
}

// RemoveLeastJob 移除最早的任务
func (q *JobQueue) RemoveLeastJob() {
	if q.queue.Len() != 0 {
		back := q.queue.Back()
		abandonJob := back.Value.(*Job)
		abandonJob.Done()
		q.queue.Remove(back)
	}
}

// waitJob 返回任务通知的通道
func (q *JobQueue) waitJob() <-chan struct{} {
	return q.noticeChan
}

// WorkerManager 代表工作管理器
type WorkerManager struct {
	jobQueue *JobQueue // 任务队列
}

// NewWorkerManager 创建 WorkerManager 实例
func NewWorkerManager(jobQueue *JobQueue) *WorkerManager {
	return &WorkerManager{
		jobQueue: jobQueue,
	}
}

// createWorker 创建工作线程
func (m *WorkerManager) createWorker() error {
	go func() {
		fmt.Println("启动工作线程成功")
		var job *Job

		for {
			select {
			case <-m.jobQueue.waitJob():
				fmt.Println("从任务队列取出一个任务")
				job = m.jobQueue.PopJob()
				fmt.Println("开始执行任务")
				job.Execute()
				fmt.Print("任务执行完成")
				job.Done()
			}
		}
	}()

	return nil
}
