import create from 'zustand'

export const useLoader = create((set) => ({
  loading: true,
  setLoading: () => set((state) => ({ ...state, loading: true })),
  setLoaded: () => set((state) => ({ ...state, loaded: false }))
}))
