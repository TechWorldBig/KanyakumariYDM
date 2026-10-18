import Ably from 'ably'
import { readSession, securityHeaders, sql } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  const session = readSession(req)
  if (session) {
    await sql.query('DELETE FROM active_sessions WHERE id=$1', [session.id])
    await sql.query(
      'INSERT INTO session_activity(username,role,section_scope,action) VALUES($1,$2,$3,$4)',
      [session.username, session.role, session.role === 'district' ? null : session.role, 'Logged out'],
    )
    if (process.env.ABLY_API_KEY) {
      try {
        const remaining = (await sql.query(
          "SELECT max(last_seen) AS last_seen FROM active_sessions WHERE role=$1 AND last_seen>now()-interval '2 minutes'",
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
  }
  res.setHeader('Set-Cookie', 'district_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0')
  return res.status(204).end()
}
