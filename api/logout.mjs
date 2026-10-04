import { readSession, securityHeaders, sql } from './_lib.mjs'
export default async function handler(req,res){securityHeaders(res);const session=readSession(req);if(session){await sql.query('DELETE FROM active_sessions WHERE id=$1',[session.id]);await sql.query('INSERT INTO session_activity(username,role,section_scope,action) VALUES($1,$2,$3,$4)',[session.username,session.role,session.role==='district'?null:session.role,'Logged out'])}res.setHeader('Set-Cookie','district_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');return res.status(204).end()}

