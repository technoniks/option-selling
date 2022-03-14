// const WebSocket = require('ws');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

class AppWebsocket {
  constructor(){
    this.io = new Server(server)//, { path: '/portfolio'})
    // this.io.of('/portfolio');
    // this.wss = new WebSocket.Server({ port: 8080, path:'/portfolio'})
    this.initWebsocket()
  }
  initWebsocket(){
    // this.wss.on("connection", ws => {
    //   this.ws = ws  
    // })
    this.io.on('connection', (socket) => {
      console.log('a user connected');

      socket.on('disconnect', () => {
        console.log('user disconnected');
      })
    });
    
    server.listen(8080, () => {
      console.log('listening on *:8080');
    });
  }
}

module.exports.AppWebsocket = AppWebsocket 