import { neon } from '@neondatabase/serverless'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
export const sql = neon(process.env.DATABASE_URL)
export async function ensureSchema(){
 await sql.query('CREATE TABLE IF NOT EXISTS active_sessions (id text PRIMARY KEY, username text NOT NULL, role text NOT NULL, section_scope text, ip_hash text NOT NULL, user_agent text, last_seen timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS traffic_events (id bigserial PRIMARY KEY, ip_hash text NOT NULL, path text NOT NULL, visited_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS session_activity (id bigserial PRIMARY KEY, username text NOT NULL, role text NOT NULL, section_scope text, action text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now())')
}
export const clientIp=req=>String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0].trim()
export const hashIp=ip=>createHash('sha256').update(String(process.env.IP_HASH_SALT||'')+ip).digest('hex')
export function sign(payload){const body=Buffer.from(JSON.stringify(payload)).toString('base64url');const signature=createHmac('sha256',process.env.SESSION_SECRET||'').update(body).digest('base64url');return body+'.'+signature}
export function readSession(req){try{const token=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('district_session='))?.slice(17);if(!token)return null;const[body,signature]=token.split('.');const expected=createHmac('sha256',process.env.SESSION_SECRET||'').update(body).digest('base64url');if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;return JSON.parse(Buffer.from(body,'base64url').toString())}catch{return null}}
