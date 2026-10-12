import { create } from 'zustand'
import { persist } from 'zustand/middleware'


export const useSettingsStore = create(
  persist(
    (set) => ({
      soundEnabled: true,
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: 'chattime-settings' }
  )
)