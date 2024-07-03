import crypto from 'crypto'
import type { NextRequest } from 'next/server'

import { isDev } from '~/lib/constants'

type Response = {
  ip?: string
  roomHash?: string
  roomUUID?: string
  headers?: Record<string, string>
}

export const runtime = 'nodejs'

export default async (req: NextRequest) => {
  const res: Response = { ip: req.ip }

  const headers: Response['headers'] = {}

  req.headers?.forEach?.((value, key) => {
    headers[key] = value
  })

  const uuid =
    req.ip ||
    (isDev ? headers['host'] : 'localhost') ||
    (Math.random() * 1000).toString() ||
    ''

  res['roomUUID'] = uuid
  res['roomHash'] = crypto.createHash('sha256').update(uuid).digest('hex')

  return new Response(JSON.stringify(res), {
    status: 200,
    headers: {
      'content-type': 'application/json'
    }
  })
}

export const config = {
  runtime: 'experimental-edge'
}
