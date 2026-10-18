import { get, put } from '@vercel/blob'
import { ensureSchema, readSession, securityHeaders, sql } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  if (!readSession(req)) return res.status(401).json({ error: 'Sign in to continue' })
  await ensureSchema()
  const session = readSession(req)
  const partner = String(req.query?.with || req.body?.with || '').trim()
  if (req.query?.mode === 'statuses' && req.method === 'GET') {
    const rows = await sql.query("SELECT role,max(last_seen) AS last_seen FROM active_sessions GROUP BY role")
    const statuses = Object.fromEntries(rows.map(row => [row.role, { lastSeen: row.last_seen, online: Date.now() - new Date(row.last_seen).getTime() < 120000 }]))
    return res.status(200).json({ statuses })
  }
  if (req.query?.mode === 'status' && req.method === 'GET') {
    const rows = await sql.query('SELECT max(last_seen) AS last_seen FROM active_sessions WHERE role=$1', [partner])
    const lastSeen = rows[0]?.last_seen || null
    return res.status(200).json({ lastSeen, online: Boolean(lastSeen && Date.now() - new Date(lastSeen).getTime() < 120000) })
  }
  if (req.query?.mode === 'unread' && req.method === 'GET') {
    const unread = await sql.query('SELECT sender_role AS role,count(*)::int AS count FROM chat_messages WHERE recipient_role=$1 AND deleted_at IS NULL AND read_at IS NULL GROUP BY sender_role', [session.role])
    return res.status(200).json({ unread })
  }
  if (req.query?.mode === 'messages') {
    if (!partner || partner === session.role) return res.status(400).json({ error: 'Choose a valid recipient' })
    const conversationKey = ['kanyakumari-chat', ...[session.role, partner].sort()].join(':')
    if (req.method === 'GET') return res.status(200).json({ messages: await sql.query('SELECT id,sender_role AS "from",recipient_role AS "to",message AS text,attachment,sent_at AS "sentAt",edited_at AS "editedAt",deleted_at AS "deletedAt",read_at AS "readAt",reactions FROM chat_messages WHERE conversation_key=$1 ORDER BY sent_at ASC LIMIT 200', [conversationKey]) })
    if (req.method === 'POST') { const body = req.body || {}; await sql.query('INSERT INTO chat_messages(id,conversation_key,sender_role,recipient_role,message,attachment,sent_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING', [String(body.id), conversationKey, session.role, partner, String(body.text || ''), body.attachment || null, body.sentAt || new Date().toISOString()]); return res.status(201).json({ ok: true }) }
    if (req.method === 'PATCH') { const id = String(req.body?.id || ''); if (req.body?.action === 'mark-read') { const rows = await sql.query('UPDATE chat_messages SET read_at=now() WHERE conversation_key=$1 AND sender_role=$2 AND recipient_role=$3 AND read_at IS NULL AND deleted_at IS NULL RETURNING id,read_at AS "readAt"', [conversationKey,partner,session.role]); return res.status(200).json({ marked: rows.length, messages: rows }) } if (req.body?.action === 'reaction') { const emoji = String(req.body?.emoji || '').slice(0,8), current = (await sql.query('SELECT reactions FROM chat_messages WHERE id=$1 AND conversation_key=$2 AND deleted_at IS NULL', [id,conversationKey]))[0]; if (!current || !emoji) return res.status(404).json({ error: 'Message not found' }); const reactions = current.reactions || {}, members = Array.isArray(reactions[emoji]) ? reactions[emoji] : []; reactions[emoji] = members.includes(session.role) ? members.filter(role=>role!==session.role) : [...members,session.role]; if (!reactions[emoji].length) delete reactions[emoji]; await sql.query('UPDATE chat_messages SET reactions=$1 WHERE id=$2 AND conversation_key=$3', [reactions,id,conversationKey]); return res.status(200).json({ id,reactions }) } const text = String(req.body?.text || '').trim(); if (!id || !text) return res.status(400).json({ error: 'Message and text are required' }); const rows = await sql.query('UPDATE chat_messages SET message=$1,edited_at=now() WHERE id=$2 AND conversation_key=$3 AND sender_role=$4 AND deleted_at IS NULL RETURNING edited_at AS "editedAt"', [text,id,conversationKey,session.role]); if (!rows.length) return res.status(403).json({ error: 'You can only edit your own message' }); return res.status(200).json({ id,text,editedAt:rows[0].editedAt }) }
    if (req.method === 'DELETE') { const id = String(req.body?.id || ''); const rows = await sql.query('UPDATE chat_messages SET deleted_at=now() WHERE id=$1 AND conversation_key=$2 AND sender_role=$3 AND deleted_at IS NULL RETURNING deleted_at AS "deletedAt"', [id,conversationKey,session.role]); if (!rows.length) return res.status(403).json({ error: 'You can only delete your own message' }); return res.status(200).json({ id,deletedAt:rows[0].deletedAt }) }
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'File storage is not configured' })
  if (req.method === 'GET') {
    const pathname = String(req.query?.pathname || '')
    if (!pathname || !pathname.startsWith('chat/')) return res.status(400).json({ error: 'Attachment not found' })
    const blob = await get(pathname, { access: 'private' })
    if (!blob) return res.status(404).json({ error: 'Attachment not found' })
    if (blob.statusCode !== 200 || !blob.stream) return res.status(404).json({ error: 'Attachment not available' })
    const filename = pathname.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '-') || 'attachment'
    const data = await new Response(blob.stream).arrayBuffer()
    res.setHeader('Content-Type', blob.blob.contentType || 'application/octet-stream')
    res.setHeader('Content-Length', String(data.byteLength))
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.status(200).end(Buffer.from(data))
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = req.body || {}, name = String(body.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '-'), type = String(body.type || 'application/octet-stream'), data = String(body.data || '')
  const allowedType = type.startsWith('image/') || ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type)
  if (!allowedType || type.startsWith('video/')) return res.status(400).json({ error: 'Only images and documents can be shared' })
  if (!data.startsWith('data:') || data.length > 7_000_000) return res.status(400).json({ error: 'Attachment must be smaller than 5 MB' })
  const blob = await put(`chat/${Date.now()}-${name}`, Buffer.from(data.split(',')[1], 'base64'), { access: 'private', contentType: type, addRandomSuffix: true })
  return res.status(201).json({ url: `/api/chat-files?pathname=${encodeURIComponent(blob.pathname)}`, name, type })
}
