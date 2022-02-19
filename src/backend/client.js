// const WebSocket = require('ws')
const { logFormat, appendLog } = require('./Utils/utils')
// const url = 'ws://192.168.43.252:8080/portfolio'
// const connection = new WebSocket(url)
 
// connection.onopen = () => {
//   connection.send('Message From Client') 
// }
 
// connection.onerror = (error) => {
//   console.log(`WebSocket error: ${error}`)
// }
 
// connection.onmessage = (e) => {
//   const d = JSON.parse(e.data)
//   !d.existed && process.stdout.clearScreenDown();
//   !d.existed && process.stdout.cursorTo(0);
//   process.stdout.write(logFormat(e.data))
// }
const { io } = require("socket.io-client");
const socket = io('http://127.0.0.1:8080', {
                reconnection: true, path: '/portfolio' 
              });
socket.on('connect', (socket) => {
  console.log('connected');
})
socket.on('message', (msg) => {
  !msg.existed && process.stdout.clearScreenDown();
  !msg.existed && process.stdout.cursorTo(0);
  process.stdout.write(logFormat(msg))
})
socket.on("disconnect", (d) => {
  console.log("disconnect");
})

