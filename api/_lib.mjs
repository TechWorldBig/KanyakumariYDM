import { neon } from '@neondatabase/serverless'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
export const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)
export function securityHeaders(res){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(self), geolocation=()')}
export async function ensureSchema(){
 await sql.query('CREATE TABLE IF NOT EXISTS active_sessions (id text PRIMARY KEY, username text NOT NULL, role text NOT NULL, section_scope text, ip_hash text NOT NULL, user_agent text, last_seen timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS traffic_events (id bigserial PRIMARY KEY, ip_hash text NOT NULL, path text NOT NULL, visited_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS session_activity (id bigserial PRIMARY KEY, username text NOT NULL, role text NOT NULL, section_scope text, action text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS managed_accounts (username text PRIMARY KEY, password_hash text NOT NULL, role text NOT NULL, section_scope text, created_at timestamptz NOT NULL DEFAULT now())')
 await sql.query("CREATE TABLE IF NOT EXISTS access_permissions (role text NOT NULL, feature text NOT NULL, level text NOT NULL CHECK (level IN ('manage','edit','view','none')), PRIMARY KEY(role,feature))")
 await sql.query('ALTER TABLE managed_accounts ADD COLUMN IF NOT EXISTS church_id text')
 await sql.query('CREATE TABLE IF NOT EXISTS church_workspaces (church_id text PRIMARY KEY, section_scope text NOT NULL, data jsonb NOT NULL DEFAULT \'{}\'::jsonb, updated_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS ydm_meetings (id bigserial PRIMARY KEY, title text NOT NULL, meet_url text NOT NULL, started_by text NOT NULL, started_role text NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), scheduled_for timestamptz NOT NULL DEFAULT now(), attendee_emails text[] NOT NULL DEFAULT ARRAY[]::text[], active boolean NOT NULL DEFAULT true)')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS scheduled_for timestamptz NOT NULL DEFAULT now()')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS attendee_emails text[] NOT NULL DEFAULT ARRAY[]::text[]')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS cancellation_reason text')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS cancelled_by text')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT \'active\'')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS completed_at timestamptz')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS completed_by text')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS mom jsonb')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS mom_published boolean NOT NULL DEFAULT false')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS mom_published_at timestamptz')
 await sql.query('ALTER TABLE ydm_meetings ADD COLUMN IF NOT EXISTS mom_published_by text')
 await sql.query('CREATE TABLE IF NOT EXISTS meeting_notification_reads (username text NOT NULL, meeting_id bigint NOT NULL REFERENCES ydm_meetings(id) ON DELETE CASCADE, read_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(username, meeting_id))')
 await sql.query('CREATE TABLE IF NOT EXISTS chat_messages (id text PRIMARY KEY, conversation_key text NOT NULL, sender_role text NOT NULL, recipient_role text NOT NULL, message text NOT NULL DEFAULT \'\', attachment jsonb, sent_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('CREATE TABLE IF NOT EXISTS user_profiles (username text PRIMARY KEY, display_name text NOT NULL DEFAULT \'\', phone text NOT NULL DEFAULT \'\', email text NOT NULL DEFAULT \'\', photo text NOT NULL DEFAULT \'\', updated_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_role text')
 await sql.query('ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz')
 await sql.query('ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz')
 await sql.query('ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reactions jsonb NOT NULL DEFAULT \'{}\'::jsonb')
 await sql.query('ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at timestamptz')
 await sql.query('CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON chat_messages(conversation_key, sent_at DESC)')
 await sql.query('CREATE TABLE IF NOT EXISTS chat_groups (id text PRIMARY KEY, name text NOT NULL, created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT \'\'')
 await sql.query('CREATE TABLE IF NOT EXISTS chat_group_members (group_id text NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE, username text NOT NULL, PRIMARY KEY(group_id,username))')
 await sql.query('CREATE INDEX IF NOT EXISTS chat_group_members_username_idx ON chat_group_members(username,group_id)')
 await sql.query('CREATE TABLE IF NOT EXISTS chat_group_messages (id text PRIMARY KEY, group_id text NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE, sender_username text NOT NULL, message text NOT NULL DEFAULT \'\', attachment jsonb, sent_at timestamptz NOT NULL DEFAULT now())')
 await sql.query('ALTER TABLE chat_group_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz')
 await sql.query('ALTER TABLE chat_group_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz')
 await sql.query('CREATE TABLE IF NOT EXISTS chat_group_message_reactions (message_id text NOT NULL REFERENCES chat_group_messages(id) ON DELETE CASCADE, username text NOT NULL, emoji text NOT NULL, PRIMARY KEY(message_id,username,emoji))')
 await sql.query('CREATE TABLE IF NOT EXISTS chat_group_message_reads (message_id text NOT NULL REFERENCES chat_group_messages(id) ON DELETE CASCADE, username text NOT NULL, read_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(message_id,username))')
 await sql.query('CREATE INDEX IF NOT EXISTS chat_group_messages_group_idx ON chat_group_messages(group_id,sent_at DESC)')
 await sql.query('CREATE TABLE IF NOT EXISTS chat_group_notifications (id bigserial PRIMARY KEY, username text NOT NULL, group_name text NOT NULL, deleted_by text NOT NULL, deleted_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz)')
 await sql.query('CREATE INDEX IF NOT EXISTS chat_group_notifications_user_idx ON chat_group_notifications(username,deleted_at DESC)')
}
const accessRoleName=role=>({district:'District Super Admin','head-pastor':'Head Pastor','think-tank':'Think Tank Admin','section-pastor':'Section Pastor Admin','church-pastor':'Pastor of Church','district-ydm':'District YDM Leader','district-women':'District Women Leader','headmaster-admin':'Headmaster Admin','teacher-admin':'Teacher Admin'}[role]||(/^section[1-4]$/.test(role)?'Section Super Admin':role))
export async function serverAccessLevel(role,feature){
 const names=[accessRoleName(role)]
 if(/^section[1-4]$/.test(role))names.push(`Section ${role.slice(-1)} Super Admin`)
 const rows=await sql.query('SELECT level FROM access_permissions WHERE role=ANY($1::text[]) AND feature=$2 ORDER BY CASE WHEN role=$3 THEN 0 ELSE 1 END LIMIT 1',[names,feature,names[0]])
 return rows[0]?.level||(role==='district'||/^section[1-4]$/.test(role)?'manage':role==='head-pastor'?'view':'view')
}
export async function requireFeatureWrite(session,feature,res){
 const level=await serverAccessLevel(session.role,feature)
 if(level==='manage'||level==='edit')return true
 res.status(403).json({error:`${feature} is view only for your role`})
 return false
}
export const clientIp=req=>String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0].trim()
export const hashIp=ip=>{const salt=process.env.IP_HASH_SALT;if(!salt||salt.length<16)throw new Error('IP_HASH_SALT must be configured');return createHash('sha256').update(salt+ip).digest('hex')}
export function hashPassword(password){const salt=randomBytes(16).toString('hex');return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`}
export function verifyPassword(password,stored){try{const[,salt,digest]=String(stored).split(':');const actual=scryptSync(password,salt,64);return timingSafeEqual(actual,Buffer.from(digest,'hex'))}catch{return false}}
function secret(){const value=process.env.SESSION_SECRET;if(!value||value.length<32)throw new Error('SESSION_SECRET must be at least 32 characters');return value}
export function sign(payload){const body=Buffer.from(JSON.stringify({...payload,exp:Math.floor(Date.now()/1000)+28800})).toString('base64url');const signature=createHmac('sha256',secret()).update(body).digest('base64url');return body+'.'+signature}
export function readSession(req){try{const token=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('district_session='))?.slice(17);if(!token)return null;const[body,signature]=token.split('.');if(!body||!signature)return null;const expected=createHmac('sha256',secret()).update(body).digest('base64url');if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const session=JSON.parse(Buffer.from(body,'base64url').toString());if(!session.exp||session.exp<Math.floor(Date.now()/1000))return null;return session}catch{return null}}
