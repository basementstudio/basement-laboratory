import { useEffect, useRef, useState } from 'react'

export const useRefState = <T>(initialValue: T) => {
  const [state, setState] = useState(initialValue)
  const ref = useRef(state)
  useEffect(() => {
    ref.current = state
  }, [state])
  return [state, setState, ref]
}
