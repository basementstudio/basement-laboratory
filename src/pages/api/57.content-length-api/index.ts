import { promises as fs } from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { path: publicPath } = req.query
  const filePath = path.join(process.cwd(), 'public', publicPath as string)

  try {
    const file = await fs.readFile(filePath)

    res.status(200)
    res.setHeader('X-Content-Length', file.byteLength)
    res.setHeader('X-File-Size', file.byteLength)
    res.send(file)
  } catch (error) {
    res.status(404).json({ error: 'File not found' })
  }
}
