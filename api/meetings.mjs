import { ensureSchema, readSession, securityHeaders, sql } from './_lib.mjs'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export default async function handler(req,res){
 securityHeaders(res); const session=readSession(req); if(!session)return res.status(401).json({error:'Sign in to continue'}); await ensureSchema()
 if(req.method==='GET'){const meetings=await sql.query("SELECT id,title,meet_url,started_by,started_role,started_at,scheduled_for,attendee_emails FROM ydm_meetings WHERE active=true AND scheduled_for >= now() - interval '2 hours' ORDER BY scheduled_for ASC LIMIT 20");return res.status(200).json({meetings})}
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 if(!['district','district-ydm'].includes(session.role))return res.status(403).json({error:'Only District Super Admin or District YDM Leader can schedule a meeting'})
 const body=req.body||{},title=String(body.title||'District YDM meeting').trim(),meetUrl='https://meet.google.com/new',scheduledFor=new Date(String(body.scheduledFor||'')),attendeeEmails=[...new Set(String(body.attendeeEmails||'').split(/[\s,;]+/).map(value=>value.trim().toLowerCase()).filter(Boolean))]
 if(Number.isNaN(scheduledFor.getTime()))return res.status(400).json({error:'Choose a valid meeting date and time'})
 if(scheduledFor.getTime()<Date.now()-60000)return res.status(400).json({error:'Meeting time must be in the future'})
 if(attendeeEmails.some(email=>!emailPattern.test(email)))return res.status(400).json({error:'Check the attendee email addresses'})
 await sql.query('UPDATE ydm_meetings SET active=false WHERE active=true')
 const meeting=(await sql.query('INSERT INTO ydm_meetings(title,meet_url,started_by,started_role,scheduled_for,attendee_emails) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,title,meet_url,started_by,started_role,started_at,scheduled_for,attendee_emails',[title,meetUrl,session.username,session.role,scheduledFor.toISOString(),attendeeEmails]))[0]
 await sql.query('INSERT INTO session_activity(username,role,section_scope,action) VALUES($1,$2,$3,$4)',[session.username,session.role,null,`Scheduled YDM meeting: ${title}`])
 return res.status(201).json({meeting})
}
