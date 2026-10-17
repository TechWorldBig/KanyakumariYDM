import { get } from '@vercel/blob'
import { readSession, securityHeaders } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  if (!readSession(req)) return res.status(401).json({ error: 'Sign in to continue' })
  const pathname = String(req.query?.pathname || '')
  if (!pathname || !pathname.startsWith('chat/')) return res.status(400).json({ error: 'Attachment not found' })
  const blob = await get(pathname, { access: 'private' })
  if (!blob) return res.status(404).json({ error: 'Attachment not found' })
  res.setHeader('Content-Type', blob.blob.contentType || 'application/octet-stream')
  const filename = pathname.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '-') || 'attachment'
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return new Promise(resolve => { blob.blob.stream.pipe(res); blob.blob.stream.on('end', resolve) })
}
