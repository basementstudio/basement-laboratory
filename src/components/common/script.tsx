import { useEffect } from 'react'

import { isServer } from '~/lib/constants'

type ScriptProps = {
  fn: () => void | (() => void)
}

export const Script = ({ fn }: ScriptProps) => {
  useEffect(() => {
    if (isServer) return

    const cleanup = fn()

    return () => {
      cleanup?.()
    }
  }, [fn])

  return <></>
}
