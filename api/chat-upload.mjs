import { put } from '@vercel/blob'
import { readSession, securityHeaders } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  if (!readSession(req)) return res.status(401).json({ error: 'Sign in to continue' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'File storage is not configured' })
  const body = req.body || {}, name = String(body.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '-'), type = String(body.type || 'application/octet-stream'), data = String(body.data || '')
  if (!data.startsWith('data:') || data.length > 7_000_000) return res.status(400).json({ error: 'Attachment must be smaller than 5 MB' })
  const base64 = data.split(',')[1]
  const blob = await put(`chat/${Date.now()}-${name}`, Buffer.from(base64, 'base64'), { access: 'private', contentType: type, addRandomSuffix: true })
  return res.status(201).json({ url: `/api/chat-attachment?pathname=${encodeURIComponent(blob.pathname)}`, name, type })
}
