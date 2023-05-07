import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { create } from 'zustand'

type State = {
  store: Record<string, { object: any; complete: boolean }>
  alreadyExists: (id: string) => boolean
  addObject: (id: string, object: any) => void
  setComplete: (id: string) => void
  progress: number
}

export const useProgress = create<State>((set, get) => {
  const getProgress = () => {
    const store = get().store
    const total = Object.keys(store).length
    const complete = Object.values(store).filter((item) => item.complete).length
    return (complete / total) * 100
  }

  const alreadyExists = (id: string) => {
    const store = get().store
    return store[id] != undefined
  }

  return {
    progress: 0,
    store: {},
    alreadyExists,
    addObject: (id: string, object: any) => {
      const store = get().store
      const alreadyExists = store[id] != undefined

      if (alreadyExists) return

      set({ store: { ...store, [id]: { object, complete: false } } })
      set({ progress: getProgress() })
    },
    setComplete: (id: string) => {
      const store = get().store
      const trgtObj = store[id]

      /* If doesn't exist or if already complete return */
      if (trgtObj === undefined || trgtObj?.complete) return

      set({
        store: {
          ...store,
          [id]: { object: trgtObj.object, complete: true }
        }
      })
      set({ progress: getProgress() })
    }
  }
})

const reducer = (
  currentSrc: (string | (string | undefined)[]) | undefined,
  action: { type: string; payload: { src: string; idx?: number } }
) => {
  if (action.type === 'main-loaded') {
    if (Array.isArray(currentSrc)) {
      if (action.payload.idx === undefined) {
        throw new Error(`idx for ${action.payload.src} is undefined`)
      }

      /* Clone the current src array for immutability */
      const nextSrc = currentSrc.slice()
      nextSrc[action.payload.idx] = action.payload.src

      return nextSrc
    }

    return action.payload.src
  }

  return currentSrc
}

type ImageData = {
  src: string
  fallbackSrc: string
}

export const useImageLoader = (src: ImageData | ImageData[]) => {
  const { add, complete, alreadyExists } = useProgress((s) => ({
    alreadyExists: s.alreadyExists,
    add: s.addObject,
    complete: s.setComplete
  }))

  const initialState = useMemo(() => {
    if (Array.isArray(src)) {
      return src.map((d) => {
        return alreadyExists(d.src) ? d.src : d.fallbackSrc
      })
    }

    return alreadyExists(src.src) ? src.src : src.fallbackSrc
  }, [src, alreadyExists])

  const [currentSrc, dispatch] = useReducer(reducer, initialState)

  const load = useCallback(
    (src: ImageData, idx?: number) => {
      if (alreadyExists(src.src)) return

      const mainImage = new Image()

      mainImage.onload = () => {
        dispatch({ type: 'main-loaded', payload: { src: src.src, idx } })
        complete(src.src)
      }

      mainImage.src = src.src
      add(src.src, mainImage)
    },
    [add, complete, alreadyExists]
  )

  useEffect(() => {
    if (Array.isArray(src)) {
      src.forEach((d, idx) => load(d, idx))
    } else {
      load(src)
    }
  }, [load])

  return currentSrc
}
