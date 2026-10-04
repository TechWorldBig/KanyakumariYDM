import { readSession, securityHeaders, sql } from './_lib.mjs'
export default async function handler(req,res){securityHeaders(res);const session=readSession(req);if(!session)return res.status(401).json({error:'Unauthorized'});await sql.query('UPDATE active_sessions SET last_seen=now() WHERE id=$1',[session.id]);return res.status(204).end()}

