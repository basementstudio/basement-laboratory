import type { NextRequest } from 'next/server'

export default (req: NextRequest) => {
  // const id = req.ip || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')

  return new Response(JSON.stringify(req), {
    status: 200,
    headers: {
      'content-type': 'application/json'
    }
  })
}

export const config = {
  runtime: 'experimental-edge'
}
