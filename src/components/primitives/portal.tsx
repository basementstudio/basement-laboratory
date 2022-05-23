import * as React from 'react'
import { createPortal } from 'react-dom'

type Props = { id?: string; onMount?: () => void }

export const Portal: React.FC<Props> = ({
  children,
  id = 'my-awesome-portal',
  onMount
}) => {
  const ref = React.useRef<HTMLElement>()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    let portal: HTMLElement | undefined = undefined
    const existingPortal = document.getElementById(id) as HTMLElement | null
    if (existingPortal) {
      portal = existingPortal
    } else {
      portal = document.createElement('div')
      portal.id = id
      document.body.appendChild(portal)
    }
    ref.current = portal
    setIsMounted(true)
  }, [id])

  React.useEffect(() => {
    if (isMounted && onMount) onMount()
  }, [isMounted, onMount])

  return isMounted && ref.current ? createPortal(children, ref.current) : null
}
