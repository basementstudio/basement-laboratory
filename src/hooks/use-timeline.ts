import gsap from 'gsap'
import { useEffect, useState } from 'react'

/* 
  Lets you create a timeline that is automatically killed when the component is unmounted or the dependencies forced a re-creation.
*/

export const useTimeline = (fn: () => gsap.core.Timeline, args: any[] = []) => {
  const [tl, setTl] = useState<gsap.core.Timeline | null>(gsap.timeline())

  useEffect(() => {
    const tl = fn()

    setTl(tl)

    return () => {
      tl?.kill()
    }
  }, args)

  return tl
}
