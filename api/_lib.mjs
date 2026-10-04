import { neon } from '@neondatabase/serverless'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
export const sql = neon(process.env.DATABASE_URL)
export function securityHeaders(res){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()')}
export async function ensureSchema(){
 await sql.query('CREATE TABLE IF NOT EXISTS active_sessions (id text PRIMARY KEY, username text NOT NULL, role text NOT NULL, section_scope text, ip_hash text NOT NULL, user_agent text, last_seen timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS traffic_events (id bigserial PRIMARY KEY, ip_hash text NOT NULL, path text NOT NULL, visited_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS session_activity (id bigserial PRIMARY KEY, username text NOT NULL, role text NOT NULL, section_scope text, action text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS managed_accounts (username text PRIMARY KEY, password_hash text NOT NULL, role text NOT NULL, section_scope text, created_at timestamptz NOT NULL DEFAULT now())')
}
export const clientIp=req=>String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0].trim()
export const hashIp=ip=>{const salt=process.env.IP_HASH_SALT;if(!salt||salt.length<16)throw new Error('IP_HASH_SALT must be configured');return createHash('sha256').update(salt+ip).digest('hex')}
export function hashPassword(password){const salt=randomBytes(16).toString('hex');return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`}
export function verifyPassword(password,stored){try{const[,salt,digest]=String(stored).split(':');const actual=scryptSync(password,salt,64);return timingSafeEqual(actual,Buffer.from(digest,'hex'))}catch{return false}}
function secret(){const value=process.env.SESSION_SECRET;if(!value||value.length<32)throw new Error('SESSION_SECRET must be at least 32 characters');return value}
export function sign(payload){const body=Buffer.from(JSON.stringify({...payload,exp:Math.floor(Date.now()/1000)+28800})).toString('base64url');const signature=createHmac('sha256',secret()).update(body).digest('base64url');return body+'.'+signature}
export function readSession(req){try{const token=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('district_session='))?.slice(17);if(!token)return null;const[body,signature]=token.split('.');if(!body||!signature)return null;const expected=createHmac('sha256',secret()).update(body).digest('base64url');if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const session=JSON.parse(Buffer.from(body,'base64url').toString());if(!session.exp||session.exp<Math.floor(Date.now()/1000))return null;return session}catch{return null}}
