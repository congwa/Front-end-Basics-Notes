
import net from 'net';

class User {
  name: string;
  addr: string;
  socket: net.Socket;

  constructor(name: string, socket: net.Socket) {
    this.name = name;
    this.addr = socket.remoteAddress + ':' + socket.remotePort;
    this.socket = socket;
  }

  send(msg: string) {
    this.socket.write(msg);
  }
}

class Chatroom {
  users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  broadcast(from: User, msg: string) {
    for (const [name, user] of this.users.entries()) {
      if (user !== from) {
        user.send(`[${from.addr}]${from.name}: ${msg}`);
      }
    }
  }

  addUser(user: User) {
    this.users.set(user.name, user);
    this.broadcast(user, '已上线\n');
  }

  removeUser(user: User) {
    this.users.delete(user.name);
    this.broadcast(user, '已下线\n');
  }

  renameUser(user: User, newName: string) {
    if (this.users.has(newName)) {
      user.send('该用户名已经存在\n');
    } else {
      const oldName = user.name;
      user.name = newName;
      this.users.delete(oldName);
      this.users.set(newName, user);
      user.send(`您已经更新用户名为: ${newName}\n`);
      this.broadcast(user, `${oldName} 更名为 ${newName}\n`);
    }
  }

  toUser(user: User, remoteName: string, content: string) {
    if (!this.users.has(remoteName)) {
      user.send(`用户 ${remoteName} 不存在\n`);
    } else if (content === '') {
      user.send('消息内容不能为空\n');
    } else {
      const remoteUser = this.users.get(remoteName)!;
      remoteUser.send(`[${user.addr}]${user.name} 对你说: ${content}\n`);
    }
  }

  handleCommand(user: User, msg: string) {
    if (msg.startsWith('rename|')) {
      this.renameUser(user, msg.split('|')[1]);
    } else if (msg.startsWith('to|')) {
      const [_, remoteName, content] = msg.split('|');
      this.toUser(user, remoteName, content);
    } else if (msg === 'who') {
      user.send('当前在线用户:\n');
      for (const [name, user] of this.users.entries()) {
        user.send(`[${user.addr}]${user.name}\n`);
      }
    } else {
      this.broadcast(user, msg);
    }
  }

  handleMessage(user: User, msg: string) {
    if (msg === '') {
      return;
    }
    if (msg.endsWith('\n')) {
      msg = msg.slice(0, -1);
    }
    if (msg.startsWith('/')) {
      this.handleCommand(user, msg.slice(1));
    } else {
      this.broadcast(user, msg);
    }
  }
}

export {User, Chatroom}

