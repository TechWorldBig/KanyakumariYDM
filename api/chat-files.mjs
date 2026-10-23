import { get, put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { ensureSchema, readSession, securityHeaders, sql } from './_lib.mjs'

const builtInAccounts = { admin: 'District Super Admin', district: 'District Super Admin', headpastor: 'Head Pastor', 'head-pastor': 'Head Pastor', ydmleader: 'District YDM Leader', districtydm: 'District YDM Leader', 'district-ydm': 'District YDM Leader', 'district-women': 'District Women Leader', headmaster: 'Headmaster Admin', 'headmaster-admin': 'Headmaster Admin', teacher: 'Teacher Admin', 'teacher-admin': 'Teacher Admin', section1: 'Section 1 Admin', section2: 'Section 2 Admin', section3: 'Section 3 Admin', section4: 'Section 4 Admin' }
const validGroupId = value => /^[0-9a-f-]{36}$/i.test(String(value || ''))

export default async function handler(req, res) {
  securityHeaders(res)
  if (!readSession(req)) return res.status(401).json({ error: 'Sign in to continue' })
  await ensureSchema()
  const session = readSession(req)
  const partner = String(req.query?.with || req.body?.with || '').trim()
  if (req.query?.mode === 'group-people' && req.method === 'GET') {
    const accounts = await sql.query('SELECT username,role,section_scope FROM managed_accounts ORDER BY username')
    const profiles = await sql.query("SELECT username,display_name FROM user_profiles WHERE display_name<>''")
    const names = Object.fromEntries(profiles.map(row => [row.username, row.display_name]))
    const people = [...Object.entries(builtInAccounts).map(([username, label]) => ({ username, label: names[username] || label })), ...accounts.map(row => ({ username: row.username, label: names[row.username] || `${row.username} · ${row.section_scope || row.role}` }))]
    return res.status(200).json({ people: people.filter(person => person.username !== session.username), allPeople: people })
  }
  if (req.query?.mode === 'groups') {
    if (req.method === 'GET') {
      const groups = await sql.query('SELECT g.id,g.name,g.description,g.created_by AS "createdBy",g.created_at AS "createdAt",count(all_members.username)::int AS "memberCount" FROM chat_groups g JOIN chat_group_members mine ON mine.group_id=g.id AND mine.username=$1 JOIN chat_group_members all_members ON all_members.group_id=g.id GROUP BY g.id ORDER BY g.created_at DESC LIMIT 100', [session.username])
      return res.status(200).json({ groups })
    }
    if (req.method === 'POST') {
      const name = String(req.body?.name || '').trim(), description = String(req.body?.description || '').trim(), members = [...new Set((Array.isArray(req.body?.members) ? req.body.members : []).map(value => String(value).trim().toLowerCase()))].filter(value => value && value !== session.username)
      if (!name || name.length > 80 || !members.length || members.length > 20) return res.status(400).json({ error: 'Enter a group name and select 1 to 20 members' })
      if (description.length > 500) return res.status(400).json({ error: 'Keep the group description under 500 characters' })
      const managed = await sql.query('SELECT username FROM managed_accounts WHERE username=ANY($1::text[])', [members])
      const allowed = new Set([...Object.keys(builtInAccounts), ...managed.map(row => row.username)])
      if (members.some(username => !allowed.has(username))) return res.status(400).json({ error: 'One or more selected accounts no longer exist' })
      const id = randomUUID()
      await sql.query('INSERT INTO chat_groups(id,name,description,created_by) VALUES($1,$2,$3,$4)', [id,name,description,session.username])
      try { await sql.query('INSERT INTO chat_group_members(group_id,username) SELECT $1,unnest($2::text[])', [id,[session.username,...members]]) }
      catch (error) { await sql.query('DELETE FROM chat_groups WHERE id=$1', [id]); throw error }
      return res.status(201).json({ group: { id,name,description,createdBy:session.username,memberCount:members.length+1 } })
    }
    if (req.method === 'DELETE') {
      const id = String(req.body?.groupId || '')
      if (!validGroupId(id)) return res.status(400).json({ error: 'Choose a valid group' })
      const notified = await sql.query(`WITH members AS MATERIALIZED (SELECT username FROM chat_group_members WHERE group_id=$1),
        deleted AS (DELETE FROM chat_groups WHERE id=$1 AND created_by=$2 RETURNING name)
        INSERT INTO chat_group_notifications(username,group_name,deleted_by)
        SELECT members.username,deleted.name,$2 FROM members CROSS JOIN deleted RETURNING id`, [id,session.username])
      if (!notified.length) return res.status(403).json({ error: 'Only the creator can delete this group' })
      return res.status(200).json({ deleted: true })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (req.query?.mode === 'group-details') {
    const groupId = String(req.query?.groupId || req.body?.groupId || '')
    if (!validGroupId(groupId)) return res.status(400).json({ error: 'Choose a valid group' })
    if (req.method === 'PATCH') {
      const description = String(req.body?.description || '').trim()
      if (description.length > 500) return res.status(400).json({ error: 'Keep the group description under 500 characters' })
      const updated = await sql.query('UPDATE chat_groups SET description=$1 WHERE id=$2 AND created_by=$3 RETURNING description', [description,groupId,session.username])
      if (!updated.length) return res.status(403).json({ error: 'Only the creator can edit the description' })
      return res.status(200).json({ description: updated[0].description })
    }
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    const group = (await sql.query('SELECT g.id,g.name,g.description,g.created_by AS "createdBy",g.created_at AS "createdAt" FROM chat_groups g JOIN chat_group_members m ON m.group_id=g.id AND m.username=$2 WHERE g.id=$1', [groupId,session.username]))[0]
    if (!group) return res.status(403).json({ error: 'This group is not available to your account' })
    const members = await sql.query("SELECT m.username,coalesce(nullif(p.display_name,''),m.username) AS name FROM chat_group_members m LEFT JOIN user_profiles p ON p.username=m.username WHERE m.group_id=$1 ORDER BY m.username", [groupId])
    return res.status(200).json({ group: { ...group,members } })
  }
  if (['group-messages', 'group-image', 'group-attachment'].includes(req.query?.mode)) {
    const groupId = String(req.query?.groupId || req.body?.groupId || '')
    if (!validGroupId(groupId)) return res.status(400).json({ error: 'Choose a valid group' })
    const member = (await sql.query('SELECT 1 FROM chat_group_members WHERE group_id=$1 AND username=$2', [groupId,session.username]))[0]
    if (!member) return res.status(403).json({ error: 'This group is not available to your account' })
    if (req.query?.mode === 'group-image' || req.query?.mode === 'group-attachment') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
      const row = (await sql.query('SELECT attachment FROM chat_group_messages WHERE group_id=$1 AND id=$2 AND deleted_at IS NULL', [groupId,String(req.query?.messageId || '')]))[0]
      const pathname = row?.attachment?.pathname
      if (!pathname || !pathname.startsWith('group-chat/')) return res.status(404).json({ error: 'Attachment not found' })
      const blob = await get(pathname, { access: 'private' })
      if (!blob || blob.statusCode !== 200 || !blob.stream) return res.status(404).json({ error: 'Attachment not available' })
      const data = await new Response(blob.stream).arrayBuffer()
      res.setHeader('Content-Type', row.attachment.type)
      res.setHeader('Content-Length', String(data.byteLength))
      return res.status(200).end(Buffer.from(data))
    }
    if (req.method === 'GET') {
      const messages = await sql.query('SELECT m.id,m.sender_username AS "sender",coalesce(nullif(p.display_name,\'\'),\'\') AS "senderDisplayName",m.message AS text,m.attachment,m.sent_at AS "sentAt",m.edited_at AS "editedAt" FROM chat_group_messages m LEFT JOIN user_profiles p ON p.username=m.sender_username WHERE m.group_id=$1 AND m.deleted_at IS NULL ORDER BY m.sent_at DESC LIMIT 200', [groupId])
      const reactions = messages.length ? await sql.query('SELECT message_id,emoji,array_agg(username) AS members FROM chat_group_message_reactions WHERE message_id=ANY($1::text[]) GROUP BY message_id,emoji', [messages.map(message => message.id)]) : []
      const reads = messages.length ? await sql.query('SELECT message_id,username FROM chat_group_message_reads WHERE message_id=ANY($1::text[])', [messages.map(message => message.id)]) : []
      const members = await sql.query('SELECT username FROM chat_group_members WHERE group_id=$1', [groupId])
      const reactionMap = new Map()
      for (const reaction of reactions) reactionMap.set(reaction.message_id, { ...(reactionMap.get(reaction.message_id) || {}), [reaction.emoji]: reaction.members })
      const readMap = new Map()
      for (const read of reads) readMap.set(read.message_id, new Set([...(readMap.get(read.message_id) || []),read.username]))
      return res.status(200).json({ messages: messages.reverse().map(message => {
        const readers = readMap.get(message.id) || new Set()
        return { ...message,reactions:reactionMap.get(message.id) || {},readByMe:message.sender===session.username||readers.has(session.username),allRead:members.every(member => member.username===message.sender||readers.has(member.username)) }
      }) })
    }
    if (req.method === 'POST') {
      const text = String(req.body?.text || '').trim(), image = req.body?.image, voice = req.body?.voice, id = randomUUID()
      if ((!text && !image && !voice) || (image && voice) || text.length > 4000) return res.status(400).json({ error: 'Enter a message with one attachment' })
      let attachment = null
      if (image) {
        const type = String(image.type || ''), data = String(image.data || ''), name = String(image.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '-')
        if (!['image/jpeg','image/png','image/webp','image/gif'].includes(type) || !data.startsWith(`data:${type};base64,`) || data.length > 7_000_000) return res.status(400).json({ error: 'Choose a JPG, PNG, WebP or GIF image smaller than 5 MB' })
        if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Image storage is not configured' })
        const blob = await put(`group-chat/${groupId}/${id}-${name}`, Buffer.from(data.split(',')[1], 'base64'), { access:'private',contentType:type,addRandomSuffix:true })
        attachment = { name,type,pathname:blob.pathname,url:`/api/chat-files?mode=group-image&groupId=${groupId}&messageId=${id}` }
      }
      if (voice) {
        const type = String(voice.type || ''), data = String(voice.data || ''), name = String(voice.name || 'voice-message').replace(/[^a-zA-Z0-9._-]/g, '-')
        if (!['audio/webm','audio/mp4','audio/ogg'].includes(type) || !data.startsWith(`data:${type};base64,`) || data.length > 4_100_000) return res.status(400).json({ error: 'Voice message must be smaller than 3 MB' })
        const bytes = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64')
        if (bytes.length > 3_000_000) return res.status(400).json({ error: 'Voice message must be smaller than 3 MB' })
        if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Voice storage is not configured' })
        const blob = await put(`group-chat/${groupId}/${id}-${name}`, bytes, { access:'private',contentType:type,addRandomSuffix:true })
        attachment = { name,type,pathname:blob.pathname,url:`/api/chat-files?mode=group-attachment&groupId=${groupId}&messageId=${id}` }
      }
      const message = (await sql.query('WITH inserted AS (INSERT INTO chat_group_messages(id,group_id,sender_username,message,attachment) VALUES($1,$2,$3,$4,$5) RETURNING id,sender_username,message,attachment,sent_at,edited_at) SELECT i.id,i.sender_username AS "sender",coalesce(nullif(p.display_name,\'\'),\'\') AS "senderDisplayName",i.message AS text,i.attachment,i.sent_at AS "sentAt",i.edited_at AS "editedAt" FROM inserted i LEFT JOIN user_profiles p ON p.username=i.sender_username', [id,groupId,session.username,text,attachment]))[0]
      return res.status(201).json({ message: { ...message,reactions:{},readByMe:true,allRead:false } })
    }
    if (req.method === 'PATCH') {
      const id = String(req.body?.id || '')
      if (req.body?.action === 'mark-read') {
        const marked = await sql.query('INSERT INTO chat_group_message_reads(message_id,username) SELECT id,$2 FROM chat_group_messages WHERE group_id=$1 AND sender_username<>$2 AND deleted_at IS NULL ON CONFLICT DO NOTHING RETURNING message_id', [groupId,session.username])
        return res.status(200).json({ marked:marked.length })
      }
      if (req.body?.action === 'reaction') {
        const emoji = String(req.body?.emoji || '').trim()
        if (!emoji || emoji.length > 16) return res.status(400).json({ error: 'Choose a valid emoji' })
        const message = (await sql.query('SELECT id FROM chat_group_messages WHERE id=$1 AND group_id=$2 AND deleted_at IS NULL', [id,groupId]))[0]
        if (!message) return res.status(404).json({ error: 'Message not found' })
        if (req.body?.remove) await sql.query('DELETE FROM chat_group_message_reactions WHERE message_id=$1 AND username=$2 AND emoji=$3', [id,session.username,emoji])
        else await sql.query('INSERT INTO chat_group_message_reactions(message_id,username,emoji) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [id,session.username,emoji])
        const rows = await sql.query('SELECT emoji,array_agg(username) AS members FROM chat_group_message_reactions WHERE message_id=$1 GROUP BY emoji', [id])
        return res.status(200).json({ id,reactions:Object.fromEntries(rows.map(row => [row.emoji,row.members])) })
      }
      const text = String(req.body?.text || '').trim()
      if (!id || text.length > 4000) return res.status(400).json({ error: 'Enter a valid message' })
      const updated = await sql.query('UPDATE chat_group_messages SET message=$1,edited_at=now() WHERE id=$2 AND group_id=$3 AND sender_username=$4 AND deleted_at IS NULL AND ($1<>\'\' OR attachment IS NOT NULL) RETURNING edited_at AS "editedAt"', [text,id,groupId,session.username])
      if (!updated.length) return res.status(403).json({ error: 'Only the sender can edit this message' })
      return res.status(200).json({ id,text,editedAt:updated[0].editedAt })
    }
    if (req.method === 'DELETE') {
      const id = String(req.body?.id || '')
      const deleted = await sql.query('UPDATE chat_group_messages SET deleted_at=now() WHERE id=$1 AND group_id=$2 AND sender_username=$3 AND deleted_at IS NULL RETURNING id', [id,groupId,session.username])
      if (!deleted.length) return res.status(403).json({ error: 'Only the sender can delete this message' })
      return res.status(200).json({ deleted:true,id })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (req.query?.mode === 'statuses' && req.method === 'GET') {
    const rows = await sql.query("WITH active AS (SELECT role,max(last_seen) AS last_seen,bool_or(last_seen>now()-interval '60 seconds') AS online FROM active_sessions GROUP BY role),history AS (SELECT role,max(occurred_at) AS last_seen FROM session_activity GROUP BY role) SELECT coalesce(active.role,history.role) AS role,greatest(active.last_seen,history.last_seen) AS last_seen,coalesce(active.online,false) AS online FROM active FULL OUTER JOIN history ON history.role=active.role")
    const statuses = Object.fromEntries(rows.map(row => [row.role, { lastSeen: row.last_seen, online: row.online }]))
    return res.status(200).json({ statuses })
  }
  if (req.query?.mode === 'status' && req.method === 'GET') {
    const rows = await sql.query("SELECT greatest((SELECT max(last_seen) FROM active_sessions WHERE role=$1),(SELECT max(occurred_at) FROM session_activity WHERE role=$1)) AS last_seen,EXISTS(SELECT 1 FROM active_sessions WHERE role=$1 AND last_seen>now()-interval '60 seconds') AS online", [partner])
    const lastSeen = rows[0]?.last_seen || null
    return res.status(200).json({ lastSeen, online: Boolean(rows[0]?.online) })
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
    res.setHeader('Content-Disposition', `${(blob.blob.contentType || '').startsWith('audio/') ? 'inline' : 'attachment'}; filename="${filename}"`)
    return res.status(200).end(Buffer.from(data))
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = req.body || {}, name = String(body.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '-'), type = String(body.type || 'application/octet-stream'), data = String(body.data || '')
  const audioType = ['audio/webm','audio/mp4','audio/ogg'].includes(type)
  const allowedType = type.startsWith('image/') || audioType || ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type)
  if (!allowedType || type.startsWith('video/')) return res.status(400).json({ error: 'Only images, documents and voice messages can be shared' })
  if (audioType && (!data.startsWith(`data:${type};base64,`) || data.length > 4_100_000 || Buffer.from(data.slice(data.indexOf(',') + 1), 'base64').length > 3_000_000)) return res.status(400).json({ error: 'Voice message must be smaller than 3 MB' })
  if (!data.startsWith('data:') || data.length > 7_000_000) return res.status(400).json({ error: 'Attachment must be smaller than 5 MB' })
  const blob = await put(`chat/${Date.now()}-${name}`, Buffer.from(data.split(',')[1], 'base64'), { access: 'private', contentType: type, addRandomSuffix: true })
  return res.status(201).json({ url: `/api/chat-files?pathname=${encodeURIComponent(blob.pathname)}`, name, type })
}
