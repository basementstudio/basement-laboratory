import { create } from 'zustand'

export const useLoader = create<{
  loading: boolean
  setLoading: () => void
  setLoaded: () => void
}>((set) => ({
  loading: true,
  setLoading: () => set((state) => ({ ...state, loading: true })),
  setLoaded: () => set((state) => ({ ...state, loading: false }))
}))
