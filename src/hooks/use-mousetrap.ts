import mousetrap from 'mousetrap'
import * as React from 'react'

type MousetrapParameters = Parameters<typeof mousetrap.bind>

export type Traps = {
  keys: MousetrapParameters['0']
  callback: MousetrapParameters['1']
  action?: MousetrapParameters['2']
}[]

export const useMousetrap = (traps: Traps, bind = true) => {
  React.useEffect(() => {
    if (bind) {
      traps.forEach(({ keys, callback, action }) =>
        mousetrap.bind(keys, callback, action)
      )
      return () => {
        traps.forEach(({ keys }) => mousetrap.unbind(keys))
      }
    }
  }, [traps, bind])
}
