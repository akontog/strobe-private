const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

app.use(express.static('public'));

io.on("connection", socket => {
  console.log("User connected:", socket.id);
});

http.listen(3000, () => {
  console.log("Open http://localhost:3000");
});
