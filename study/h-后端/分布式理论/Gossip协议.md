# Gossip协议

Gossip 协议，就像流言蜚语一样，利用一种随机、带有传染性的方式，将信息传播到整个网络中，并在一定时间内，使得系统内的所有节点数据一致。

掌握这个协议不仅能很好地理解这种最常用的，**实现最终一致性的算法，也能在后续工作中得心应手地实现数据的最终一致性**。


## 直接邮寄

直接邮寄：就是直接发送更新数据，当数据发送失败时，将数据缓存下来，然后重传。

直接邮寄虽然实现起来比较容易，数据同步也很及时，但可能会因为缓存队列满了而丢数据。也就是说，只采用直接邮寄是无法实现最终一致性的。
## 反熵

反熵是一种通过异步修复实现最终一致性的方法， 见的最终一致性系统（比如 Cassandra），都实现了反熵功能

反熵指的是集群中的节点，每隔段时间就随机选择某个其他节点，然后通过互相交换自己的所有数据来消除两者之间的差异，实现数据的最终一致性


其实，在实现反熵的时候，主要有推、拉和推拉三种方式。

- 推方式，就是将自己的所有副本数据，推给对方，修复对方副本中的熵
- 拉方式，就是拉取对方的所有副本数据，修复自己副本中的熵：
- 推拉这个方式就很好理解了，这个方式就是同时修复自己副本和对方副本中的熵：

反熵需要节点两两交换和比对自己所有的数据，执行反熵时通讯成本会很高，所以我不建议你在实际场景中频繁执行反熵，并且可以通过引入校验和（Checksum）等机制，降低需要对比的数据量和通讯消息等

虽然反熵很实用，但是**执行反熵时，相关的节点都是已知的，而且节点数量不能太多**，如果是一个动态变化或节点数比较多的分布式环境（比如在 DevOps 环境中检测节点故障，并动态维护集群节点状态），这时反熵就不适用了


### 反熵的循环修复
![gossip_1](/study/imgs/gossip_1.png)

它是按照一定顺序来修复节点的数据差异，先随机选择一个节点，然后循环修复，每个节点生成自己节点有、下一个节点没有的差异数据，发送给下一个节点，进行修复.

据修复的起始节点为节点 A，数据修复是按照顺时针顺序，循环修复的。需要你注意的是，最后节点 A 又对节点 B 的数据执行了一次数据修复操作，因为只有这样，节点 C 有、节点 B 缺失的差异数据，才会同步到节点 B 上

## 谣言传播

谣言传播，广泛地散播谣言，它指的是当一个节点有了新数据后，这个节点变成活跃状态，并周期性地联系其他节点向其发送新数据，直到所有的节点都存储了该新数据。


## Gossip协议内容

Gossip协议是基于六度分隔理论（Six Degrees of Separation）哲学的体现，简单的来说，一个人通过6个中间人可以认识世界任何人

![six](/study/imgs/gossip_six.png)

​n表示复杂度，N表示人的总数，W表示每个人的联系宽度。依据邓巴数，即每个人认识150人，其六度就是150^6

​＝11,390,625,000,000（约11.4万亿）

执行流程
- 种子节点周期性的散播消息 【假定把周期限定为 1 秒】。
- 被感染节点随机选择N个邻接节点散播消息【假定fan-out(扇出)设置为6，每次最多往6个节点散播】。
- 节点只接收消息不反馈结果。
- 每次散播消息都选择尚未发送过的节点进行散播。
- 收到消息的节点不回传散播：A -> B，那么B进行散播的时候，不再发给 A。

Gossip 协议的信息传播和扩散通常需要由种子节点发起。整个传播过程可能需要一定的时间，由于不能保证某个时刻所有节点都收到消息，但是理论上最终所有节点都会收到消息，因此它是一个最终一致性协议。

Gossip协议是一个多主协议，所有写操作可以由不同节点发起，并且同步给其他副本。Gossip内组成的网络节点都是对等节点，是非结构化网络。


Gossip协议分为两种

1. 反熵传播使用“simple epidemics(SI model)”的方式：以固定的概率传播所有的数据. 所有参与节点只有两种状态：Suspective(病原)：处于 susceptible 状态的节点代表其并没有收到来自其他节点的更新。Infective(感染)：处于 infective 状态的节点代表其有数据更新，并且会将这个数据分享给其他节点。
2. 谣言传播使用“complex epidemics”(SIR model)的方式:以固定的概率仅传播新到达的数据。所有参与节点有三种状态：Suspective(病原)、Infective(感染)、Removed(愈除). Removed(愈除):其已经接收到来自其他节点的更新，但是其并不会将这个更新分享给其他节点。


谣言传播过程是消息只包含最新 update，谣言消息在某个时间点之后会被标记为removed，并且不再被传播。缺点是系统有一定的概率会不一致，通常用于节点间数据增量同步。


一般来说，为了在通信代价和可靠性之间取得折中，需要将这两种方法结合使用。

Gossip 协议最终目的是将数据分发到网络中的每一个节点。不管是 Anti-Entropy 还是 Rumor-Mongering 都涉及到节点间的数据交互方式，Gossip网络中两个节点之间存在三种通信方式：Push、Pull 以及 Push&Pull：

- Push: 发起信息交换的节点 A 随机选择联系节点 B，并向其发送自己的信息，节点 B 在收到信息后更新比自己新的数据，一般拥有新信息的节点才会作为发起节点
- Pull：发起信息交换的节点 A 随机选择联系节点 B，并从对方获取信息。一般无新信息的节点才会作为发起节点
- Push&Pull：发起信息交换的节点 A 向选择的节点 B 发送信息，同时从对方获取数据，用于更新自己的本地数据。

如果把两个节点数据同步一次定义为一个周期，则在一个周期内，Push 需通信 1 次，Pull 需 2 次，Push&Pull 则需 3 次。虽然消息数增加了，但从效果上来讲，Push&Pull 最好，理论上一个周期内可以使两个节点完全一致。直观上，Push&Pull 的收敛速度也是最快的。

Gossip 协议是按照流言传播或流行病传播的思想实现的，所以，Gossip 协议的实现算法也是很简单的


```js
// 初始化节点列表
let nodes = [];

// 定义节点类
class Node {
  constructor(id) {
    this.id = id;
    this.neighbors = [];
  }

  // 将邻居节点添加到列表中
  addNeighbor(node) {
    this.neighbors.push(node);
  }

  // 随机选择N个邻居节点进行消息散播
  gossip() {
    let selectedNeighbors = [];
    while (selectedNeighbors.length < N) {
      let neighbor = this.neighbors[Math.floor(Math.random() * this.neighbors.length)];
      if (!selectedNeighbors.includes(neighbor)) {
        selectedNeighbors.push(neighbor);
        neighbor.receiveMessage();
      }
    }
  }

  // 收到消息并进行处理
  receiveMessage() {
    // 处理消息的逻辑
    // ...
  }
}

// 创建节点列表
for (let i = 0; i < N; i++) {
  nodes.push(new Node(i));
}

// 构建节点之间的连接关系
for (let i = 0; i < N; i++) {
  let node = nodes[i];
  let numNeighbors = Math.floor(Math.random() * W); // 设置每个节点的联系宽度
  while (node.neighbors.length < numNeighbors) {
    let neighbor = nodes[Math.floor(Math.random() * N)];
    if (!node.neighbors.includes(neighbor) && node !== neighbor) {
      node.addNeighbor(neighbor);
      neighbor.addNeighbor(node);
    }
  }
}

// 种子节点周期性散播消息
setInterval(() => {
  let seedNode = nodes[Math.floor(Math.random() * N)]; // 随机选择种子节点
  seedNode.gossip();
}, 1000); // 假设把周期限定为1秒

```