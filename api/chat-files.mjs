import { get, put } from '@vercel/blob'
import { readSession, securityHeaders } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  if (!readSession(req)) return res.status(401).json({ error: 'Sign in to continue' })
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'File storage is not configured' })
  if (req.method === 'GET') {
    const pathname = String(req.query?.pathname || '')
    if (!pathname || !pathname.startsWith('chat/')) return res.status(400).json({ error: 'Attachment not found' })
    const blob = await get(pathname, { access: 'private' })
    if (!blob) return res.status(404).json({ error: 'Attachment not found' })
    const filename = pathname.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '-') || 'attachment'
    res.setHeader('Content-Type', blob.blob.contentType || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return new Promise(resolve => { blob.blob.stream.pipe(res); blob.blob.stream.on('end', resolve) })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = req.body || {}, name = String(body.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '-'), type = String(body.type || 'application/octet-stream'), data = String(body.data || '')
  const allowedType = type.startsWith('image/') || ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type)
  if (!allowedType || type.startsWith('video/')) return res.status(400).json({ error: 'Only images and documents can be shared' })
  if (!data.startsWith('data:') || data.length > 7_000_000) return res.status(400).json({ error: 'Attachment must be smaller than 5 MB' })
  const blob = await put(`chat/${Date.now()}-${name}`, Buffer.from(data.split(',')[1], 'base64'), { access: 'private', contentType: type, addRandomSuffix: true })
  return res.status(201).json({ url: `/api/chat-files?pathname=${encodeURIComponent(blob.pathname)}`, name, type })
}
