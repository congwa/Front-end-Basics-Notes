import net from 'net';

import {User, Chatroom} from './user';

const chatroom = new Chatroom();
const server = net.createServer((socket) => {
  const user = new User(socket.remoteAddress + ':' + socket.remotePort, socket);

  chatroom.addUser(user);

  socket.on('data', (data) => {
    chatroom.handleMessage(user, data.toString());
  });

  socket.on('end', () => {
    chatroom.removeUser(user);
  });
});

server.listen(8888, () => {
  console.log('Server started on port 8888');
});
