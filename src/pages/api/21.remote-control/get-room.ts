import crypto from 'crypto'
import type { NextRequest } from 'next/server'

type Response = {
  ip?: string
  headers: Record<string, string>
  roomHash?: string
  roomUUID?: string
}

export default (req: NextRequest) => {
  const res: Response = { ip: req.ip, headers: {} }

  req.headers.forEach((value, key) => {
    res['headers'][key] = value
  })

  const uuid = req.ip || '' + crypto.randomBytes(16).toString('hex')

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
