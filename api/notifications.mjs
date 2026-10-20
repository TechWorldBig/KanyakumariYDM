import { ensureSchema, readSession, securityHeaders, sql } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  const session = readSession(req)
  if (!session) return res.status(401).json({ error: 'Sign in to continue' })
  await ensureSchema()
  if (req.method === 'GET') {
    const notifications = await sql.query(`SELECT m.id, m.title, m.scheduled_for, m.cancellation_reason, m.cancelled_at, m.cancelled_by, r.read_at
      FROM ydm_meetings m LEFT JOIN meeting_notification_reads r ON r.meeting_id=m.id AND r.username=$1
      WHERE m.cancelled_at IS NOT NULL ORDER BY m.cancelled_at DESC LIMIT 50`, [session.username])
    return res.status(200).json({ notifications })
  }
  if (req.method === 'POST') {
    const id = Number(req.body?.meetingId)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Choose a valid notification' })
    const meeting = (await sql.query('SELECT id FROM ydm_meetings WHERE id=$1 AND cancelled_at IS NOT NULL', [id]))[0]
    if (!meeting) return res.status(404).json({ error: 'Notification not found' })
    await sql.query('INSERT INTO meeting_notification_reads(username, meeting_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [session.username, id])
    return res.status(200).json({ read: true })
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
