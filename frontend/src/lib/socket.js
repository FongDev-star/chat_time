import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (getToken) => {
  if (socket) return socket

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    // A fresh Clerk token is fetched on every (re)connect
    auth: async (cb) => {
      const token = await getToken()
      cb({ token })
    },
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}