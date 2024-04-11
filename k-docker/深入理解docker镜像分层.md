# docker镜像的分层

我们知道docker镜像每层指令都会创建一个新的层，当您更改 Dockerfile 并重新构建镜像时，**仅重建那些已更改的层**。这里深入了解一下细节。


Docker 镜像具有分层结构，每个分层包含了部分文件系统的文件，在 Docker 容器启动时，这些分层会组合成一个完整的文件系统。

## 镜像分层的原理

每个 Docker 镜像都由多个只读层组成，每个层都是基于上一个层创建的。


当容器启动时，Docker 将这些层组合在一起形成容器的文件系统。每个层都由文件或目录的变更组成，这可以是添加、修改或删除文件。因此，如果我们修改了一个镜像的任何层，都会影响到它自身和继承它的所有容器。

```shell
Layer 3 - Modified Files
Layer 2 - Modified Files
Layer 1 - Modified Files
Layer 0 - Base Image
```

- Layer 0 是基础镜像，是其他层的基础，包含了操作系统
- Layer 1 包含操作系统上编译的软件（例如Apache）
- Layer 2 包含操作系统和软件上的配置信息
- Layer 3 包含应用程序和数据文件


## 镜像分层的优点


- 共享：Docker 镜像的不同部分（层）可以被多个镜像共享。例如，可以有一个镜像作为基础镜像，其他镜像在此基础上构建而来。
- 缓存：Docker 使用每个镜像的层缓存中间状态。如果再次构建一个基于原始镜像的容器时，Docker 会使用缓存而不是再一次构建完整的镜像。
- 聚焦：每个层都包含了完整的文件系统，因此不必将所有文件复制到一个镜像中。这使得镜像更加轻量级。


## 例子加深理解


简单来说，一个 Image 是通过一个 DockerFile 定义的，然后使用 docker build 命令构建它

DockerFile 中的每一条命令的执行结果都会成为 Image 中的一个 Layer

这里，我们通过 Build 一个镜像，来观察 Image 的分层机制：

```shell
# Use an official Python runtime as a parent image
FROM python:2.7-slim

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NAME World

# Run app.py when the container launches
CMD ["python", "app.py"]
```

构建结果

```shell
root@rds-k8s-18-svr0:~/xuran/exampleimage# docker build -t hello ./
Sending build context to Docker daemon  5.12 kB
Step 1/7 : FROM python:2.7-slim
 ---> 804b0a01ea83
Step 2/7 : WORKDIR /app
 ---> Using cache
 ---> 6d93c5b91703
Step 3/7 : COPY . /app
 ---> Using cache
 ---> feddc82d321b
Step 4/7 : RUN pip install --trusted-host pypi.python.org -r requirements.txt
 ---> Using cache
 ---> 94695df5e14d
Step 5/7 : EXPOSE 81
 ---> Using cache
 ---> 43c392d51dff
Step 6/7 : ENV NAME World
 ---> Using cache
 ---> 78c9a60237c8
Step 7/7 : CMD python app.py
 ---> Using cache
 ---> a5ccd4e1b15d
Successfully built a5ccd4e1b15d
```

通过构建结果可以看出，构建的过程就是执行 Dockerfile 文件中我们写入的命令。

构建一共进行了7个步骤，**每个步骤进行完都会生成一个随机的 ID，来标识这一 layer 中的内容**。最后一行的 a5ccd4e1b15d 为镜像的 ID。由于我贴上来的构建过程已经是构建了第二次的结果了，所以可以看出，对于没有任何修改的内容，Docker 会复用之前的结果。

如果 DockerFile 中的内容没有变动，那么相应的镜像在 build 的时候会复用之前的 layer，以便提升构建效率。并且，即使文件内容有修改，那也只会重新 build 修改的 layer，其他未修改的也仍然会复用。



