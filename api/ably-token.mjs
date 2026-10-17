import Ably from 'ably'
import { readSession, securityHeaders } from './_lib.mjs'

export default async function handler(req, res) {
  securityHeaders(res)
  const session = readSession(req)
  if (!session) return res.status(401).json({ error: 'Sign in to continue' })
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.ABLY_API_KEY) return res.status(503).json({ error: 'Realtime messaging is not configured' })
  const allowedRoles = ['district', 'head-pastor', 'think-tank', 'section-pastor', 'church-pastor', 'district-ydm', 'district-women', 'section1', 'section2', 'section3', 'section4']
  const partner = String(req.query?.with || '').trim()
  if (!allowedRoles.includes(partner) || partner === session.role) return res.status(400).json({ error: 'Choose a valid conversation recipient' })
  const channelName = `kanyakumari-chat:${[session.role, partner].sort().join(':')}`
  const clientId = `${session.username}:${session.role}`
  const capability = { [channelName]: ['publish', 'subscribe', 'presence', 'history'] }
  const realtime = new Ably.Rest(process.env.ABLY_API_KEY)
  const tokenRequest = await realtime.auth.createTokenRequest({ clientId, capability: JSON.stringify(capability) })
  return res.status(200).json(tokenRequest)
}
