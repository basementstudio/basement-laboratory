import type { NextRequest, NextResponse } from 'next/server'

export default (req: NextRequest, res: NextResponse) => {
  // @ts-ignore
  res.json(req.headers)
}
