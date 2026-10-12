import { create } from 'zustand'
import { connectSocket, disconnectSocket } from '../lib/socket'
import { useChatStore } from './useChatStore'

export const useSocketStore = create((set) => ({
  onlineUserIds: [],

  connect: (getToken) => {
    const socket = connectSocket(getToken)

    // Remove old listeners first, so nothing runs twice
    socket.off('onlineUsers')
    socket.off('newMessage')
    socket.off('connect_error')

    socket.on('onlineUsers', (ids) => set({ onlineUserIds: ids }))
    socket.on('newMessage', (payload) => {
      useChatStore.getState().receiveMessage(payload)
    })
    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message)
    })
  },

  disconnect: () => {
    disconnectSocket()
    set({ onlineUserIds: [] })
  },
}))