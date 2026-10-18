import Ably from 'ably'
import { readSession, securityHeaders, sql } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  const session = readSession(req)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.query?.offline === '1') {
    await sql.query("UPDATE active_sessions SET last_seen=now()-interval '61 seconds' WHERE id=$1", [session.id])
    if (process.env.ABLY_API_KEY) {
      try {
        const remaining = (await sql.query(
          "SELECT max(last_seen) AS last_seen FROM active_sessions WHERE role=$1 AND last_seen>now()-interval '60 seconds'",
          [session.role],
        ))[0]?.last_seen || null
        const realtime = new Ably.Rest(process.env.ABLY_API_KEY)
        await realtime.channels.get('kanyakumari-district').publish('role-status', {
          role: session.role,
          online: Boolean(remaining),
          lastSeen: remaining || new Date().toISOString(),
        })
      } catch {}
    }
    return res.status(204).end()
  }
  await sql.query('UPDATE active_sessions SET last_seen=now() WHERE id=$1', [session.id])
  if (process.env.ABLY_API_KEY) {
    try {
      const realtime = new Ably.Rest(process.env.ABLY_API_KEY)
      await realtime.channels.get('kanyakumari-district').publish('role-status', {
        role: session.role,
        online: true,
        lastSeen: new Date().toISOString(),
      })
    } catch {}
  }
  return res.status(204).end()
}
