import { ensureSchema, readSession, securityHeaders, sql } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  const session = readSession(req)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const isDistrict = session.role === 'district'
  const isSection = /^section[1-4]$/.test(session.role)
  if (!isDistrict && !isSection) return res.status(403).json({ error: 'Audit log access is restricted' })
  await ensureSchema()
  const rows = isDistrict
    ? await sql.query('SELECT username, role, section_scope, action, occurred_at FROM session_activity ORDER BY occurred_at DESC LIMIT 200')
    : await sql.query('SELECT username, role, section_scope, action, occurred_at FROM session_activity WHERE section_scope=$1 ORDER BY occurred_at DESC LIMIT 200', [session.sectionScope || `Section ${session.role.slice(-1)}`])
  return res.status(200).json({ entries: rows })
}
