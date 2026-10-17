import { ensureSchema, readSession, securityHeaders, sql } from './_lib.mjs'
export default async function handler(req,res){
 securityHeaders(res); const session=readSession(req); if(!session)return res.status(401).json({error:'Sign in to continue'}); await ensureSchema()
 if(req.method==='GET'){const meetings=await sql.query('SELECT id,title,meet_url,started_by,started_role,started_at FROM ydm_meetings WHERE active=true ORDER BY started_at DESC LIMIT 10');return res.status(200).json({meetings})}
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 if(!['district','district-ydm'].includes(session.role))return res.status(403).json({error:'Only District Super Admin or District YDM Leader can start a meeting'})
 const body=req.body||{},title=String(body.title||'District YDM meeting').trim(),meetUrl=String(body.meetUrl||'').trim()
 if(!/^https:\/\/meet\.google\.com\//.test(meetUrl))return res.status(400).json({error:'Enter a valid Google Meet link'})
 await sql.query('UPDATE ydm_meetings SET active=false WHERE active=true')
 const meeting=(await sql.query('INSERT INTO ydm_meetings(title,meet_url,started_by,started_role) VALUES($1,$2,$3,$4) RETURNING id,title,meet_url,started_by,started_role,started_at',[title,meetUrl,session.username,session.role]))[0]
 await sql.query('INSERT INTO session_activity(username,role,section_scope,action) VALUES($1,$2,$3,$4)',[session.username,session.role,null,`Started YDM meeting: ${title}`])
 return res.status(201).json({meeting})
}
