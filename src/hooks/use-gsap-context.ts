import { gsap } from 'lib/gsap'
import { useEffect } from 'react'

export const useGsapContext = (func: gsap.ContextFunc, deps: any[] = []) => {
  useEffect(() => {
    const ctx = gsap.context(func)

    return () => {
      ctx?.revert()
    }
  }, deps)
}
