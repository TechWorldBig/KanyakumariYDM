import { readSession, sql } from './_lib.mjs'
export default async function handler(req,res){const session=readSession(req);if(session)await sql.query("UPDATE active_sessions SET last_seen=now()-interval '1 day' WHERE id=$1",[session.id]);res.setHeader('Set-Cookie','district_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');return res.status(204).end()}
