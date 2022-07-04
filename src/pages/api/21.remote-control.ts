import type { NextRequest } from 'next/server'

type Response = {
  ip?: string
  headers: Record<string, string>
}

export default (req: NextRequest) => {
  const res: Response = { ip: req.ip, headers: {} }

  req.headers.forEach((value, key) => {
    res['headers'][key] = value
  })

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
