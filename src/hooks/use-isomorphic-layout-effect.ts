import { useEffect, useLayoutEffect } from 'react'

import { isClient } from '~/lib/constants'

export const useIsomorphicLayoutEffect = isClient ? useLayoutEffect : useEffect
