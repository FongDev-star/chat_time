import { create } from 'zustand'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { playNotificationSound } from '../lib/sound'
import { useSettingsStore } from './useSettingsStore'
import { useUserStore } from './useUserStore'
import { displayName } from '../lib/utils'
import { createElement } from 'react'
import { MessageCircle } from 'lucide-react'
import { showBrowserNotification } from '../lib/notify'

const getMyId = () => useUserStore.getState().currentUser?._id

// Returns the conversation with my unread count set to 0
const withUnreadCleared = (conv, myId) => ({
  ...conv,
  unread: (conv.unread || []).map((u) =>
    String(u.user?._id || u.user) === myId ? { ...u, count: 0 } : u
  ),
})

export const useChatStore = create((set, get) => ({

  
  conversations: [],
  messages: {},
  selectedChatId: null,
  isLoadingChats: true,
  searchResults: [],
  isSearching: false,

  loadChats: async () => {
    set({ isLoadingChats: true })
    try {
      const { data } = await api.get('/conversations')
      set({ conversations: data })
    } catch (error) {
      console.error('loadChats error:', error)
      toast.error('Could not load your chats')
    } finally {
      set({ isLoadingChats: false })
    }
  },

  loadMessages: async (id) => {
    try {
      const { data } = await api.get(`/conversations/${id}/messages`)
      set((state) => ({ messages: { ...state.messages, [id]: data } }))
    } catch (error) {
      console.error('loadMessages error:', error)
      toast.error('Could not load messages')
    }
  },

  selectChat: (id) => {
    const myId = getMyId()
    set((state) => ({
      selectedChatId: id,
      conversations: state.conversations.map((c) =>
        c._id === id ? withUnreadCleared(c, myId) : c
      ),
    }))
    get().loadMessages(id)
    get().markRead(id)
  },

  markRead: async (id) => {
    try {
      await api.patch(`/conversations/${id}/read`)
    } catch (error) {
      console.error('markRead error:', error)
    }
  },

  clearSelectedChat: () => set({ selectedChatId: null }),

  uploadMedia: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/messages/upload', formData)
      return data // { mediaUrl, mediaType }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
      return null
    }
  },

  sendMessage: async (text, media) => {
    const { selectedChatId } = get()
    if (!selectedChatId) return false

    try {
      const { data } = await api.post('/messages', {
        conversationId: selectedChatId,
        text,
        ...(media || {}),
      })

      const preview = text || (media?.mediaType === 'video' ? 'Video' : 'Photo')

      set((state) => ({
        messages: {
          ...state.messages,
          [selectedChatId]: [...(state.messages[selectedChatId] || []), data],
        },
        conversations: state.conversations
          .map((c) =>
            c._id === selectedChatId
              ? { ...c, lastMessage: preview, updatedAt: data.createdAt }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      }))
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send message')
      return false
    }
  },

  searchUsers: async (q) => {
    const query = q.trim()
    if (query.length < 2) {
      set({ searchResults: [], isSearching: false })
      return
    }

    set({ isSearching: true })
    try {
      const { data } = await api.get('/users/search', { params: { q: query } })
      set({ searchResults: data })
    } catch (error) {
      console.error('searchUsers error:', error)
      toast.error('Search failed')
    } finally {
      set({ isSearching: false })
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  startChat: async (userId) => {
    try {
      const { data } = await api.post('/conversations', { userId })

      set((state) => ({
        conversations: state.conversations.some((c) => c._id === data._id)
          ? state.conversations
          : [data, ...state.conversations],
        searchResults: [],
      }))
      get().selectChat(data._id)
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not start chat')
      return false
    }
  },

  // Called when the server pushes a message from someone else
  receiveMessage: ({ message, conversation }) => {
    const { selectedChatId } = get()
    const myId = getMyId()
    const chatIsOpen = selectedChatId === message.conversationId && !document.hidden

    if (!chatIsOpen && useSettingsStore.getState().soundEnabled) {
      playNotificationSound()
    }

    if (!chatIsOpen) {
      const sender = conversation.participants?.find(
        (p) => String(p._id) === String(message.senderId)
      )
      const raw =
        message.text || (message.mediaType === 'video' ? 'Sent a video' : 'Sent a photo')
      const preview = raw.length > 60 ? `${raw.slice(0, 60)}...` : raw
      if (document.hidden || !document.hasFocus()) {
        showBrowserNotification({
          title: sender ? displayName(sender) : 'ChatTime',
          body: preview,
          tag: message.conversationId,
          onClick: () => get().selectChat(message.conversationId),
        })
      }
    }

    set((state) => {
      const exists = state.conversations.some((c) => c._id === conversation._id)

      // The server's unread counts are the truth, except when I am looking at this chat
      const incoming = chatIsOpen
        ? withUnreadCleared(conversation, myId)
        : conversation

      const conversations = (
        exists
          ? state.conversations.map((c) =>
              c._id === conversation._id
                ? {
                    ...c,
                    lastMessage: conversation.lastMessage,
                    updatedAt: conversation.updatedAt,
                    unread: incoming.unread,
                  }
                : c
            )
          : [incoming, ...state.conversations]
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

      // Only append if that chat's messages are already loaded.
      // Otherwise they are fetched in full when the chat is opened.
      const loaded = state.messages[message.conversationId]
      const messages = loaded
        ? {
            ...state.messages,
            [message.conversationId]: loaded.some((m) => m._id === message._id)
              ? loaded
              : [...loaded, message],
          }
        : state.messages

      return { conversations, messages }
    })

    // The backend already counted it as unread, so tell it I have read it
    if (chatIsOpen) get().markRead(message.conversationId)
  },

  resetChats: () =>
    set({
      conversations: [],
      messages: {},
      selectedChatId: null,
      isLoadingChats: true,
      searchResults: [],
    }),
}))