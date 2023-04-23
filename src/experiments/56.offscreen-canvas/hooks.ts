import { useCallback, useEffect, useRef } from 'react'

export const useMessageManager = (worker: Worker) => {
  const workerReady = useRef(false)
  const pendingMessages = useRef<any[]>([])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ready') {
        pendingMessages.current.forEach((message) => {
          worker.postMessage(message)
        })

        pendingMessages.current = []

        workerReady.current = true
      }
    }

    worker.addEventListener('message', handleMessage)

    return () => {
      worker.removeEventListener('message', handleMessage)
    }
  }, [worker])

  return useCallback(
    (message: any) => {
      if (workerReady.current) {
        worker.postMessage(message)
      } else {
        pendingMessages.current.push(message)
      }
    },
    [worker]
  )
}
