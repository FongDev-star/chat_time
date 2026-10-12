import { create } from 'zustand'
import toast from 'react-hot-toast'
import { api } from '../lib/api'

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoadingUser: false,

  fetchCurrentUser: async () => {
    set({ isLoadingUser: true })
    try {
      const { data } = await api.get('/users/me')
      set({ currentUser: data })
    } catch (error) {
      console.error('fetchCurrentUser error:', error)
      toast.error('Could not load your account')
    } finally {
      set({ isLoadingUser: false })
    }
  },

  clearCurrentUser: () => set({ currentUser: null }),
}))