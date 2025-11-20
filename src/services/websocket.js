import { io } from 'socket.io-client'

let socket = null

export function initSocket(token) {
  if (socket) {
    socket.disconnect()
  }

  socket = io('http://localhost:8080', {
    auth: { token },
    transports: ['websocket']
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
}

