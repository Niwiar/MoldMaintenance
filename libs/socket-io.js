const socketio = require("socket.io");
let io;

const socketConnection = (server) => {
  io = socketio(server);

  io.on("connection", (socket) => {
    console.log(`Client connected [id=${socket.id}]`);

    socket.on("reconnection_attempt", () => {
      console.log(`reconnecting`);
    });
    socket.on("reconnect", () => {
      console.log(`reconnect`);
    });
    socket.on('joinRoom', async (Room) => {
      socket.join(Room)
      sendData(Room, 'check-connect', 'Welcome to ' + Room)
    })

    socket.on("disconnect", () => {
      console.log(`Client disconnected [id=${socket.id}]`);
    });
  });
};

const sendData = (Room, Key, Data) => io.to(Room).emit(Key, Data);

module.exports = {
  socketConnection,
  sendData,
};
