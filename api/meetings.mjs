import { ensureSchema, readSession, securityHeaders, sql } from './_lib.mjs'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export default async function handler(req,res){
 securityHeaders(res); const session=readSession(req); if(!session)return res.status(401).json({error:'Sign in to continue'}); await ensureSchema()
 if(req.method==='GET'&&req.query?.mode==='notifications'){
  const notifications=await sql.query(`SELECT m.id,m.title,m.scheduled_for,m.cancellation_reason,m.cancelled_at,m.cancelled_by,r.read_at
   FROM ydm_meetings m LEFT JOIN meeting_notification_reads r ON r.meeting_id=m.id AND r.username=$1
   WHERE m.cancelled_at IS NOT NULL ORDER BY m.cancelled_at DESC LIMIT 50`,[session.username])
  return res.status(200).json({notifications})
 }
 if(req.method==='GET'){const meetings=await sql.query("SELECT id,title,meet_url,started_by,started_role,started_at,scheduled_for,attendee_emails,active,cancellation_reason,cancelled_at,cancelled_by FROM ydm_meetings WHERE (active=true AND scheduled_for >= now() - interval '2 hours') OR cancelled_at IS NOT NULL ORDER BY active DESC, CASE WHEN active THEN scheduled_for END ASC, cancelled_at DESC LIMIT 100");return res.status(200).json({meetings})}
 if(req.method==='POST'&&req.query?.mode==='notification-read-all'){
  await sql.query(`INSERT INTO meeting_notification_reads(username,meeting_id)
   SELECT $1,id FROM ydm_meetings WHERE cancelled_at IS NOT NULL ORDER BY cancelled_at DESC LIMIT 50
   ON CONFLICT DO NOTHING`,[session.username])
  return res.status(200).json({read:true})
 }
 if(req.method==='POST'&&req.query?.mode==='notification-read'){
  const id=Number(req.body?.meetingId)
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:'Choose a valid notification'})
  const meeting=(await sql.query('SELECT id FROM ydm_meetings WHERE id=$1 AND cancelled_at IS NOT NULL',[id]))[0]
  if(!meeting)return res.status(404).json({error:'Notification not found'})
  await sql.query('INSERT INTO meeting_notification_reads(username,meeting_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[session.username,id])
  return res.status(200).json({read:true})
 }
 if(req.method==='DELETE'){
  if(!['district','district-ydm'].includes(session.role))return res.status(403).json({error:'Only District Super Admin or District YDM Leader can cancel a meeting'})
  const id=Number(req.body?.id),reason=String(req.body?.reason||'').trim()
  if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:'Choose a valid meeting'})
  if(!reason||reason.length>500)return res.status(400).json({error:'Enter a cancellation reason of up to 500 characters'})
  const meeting=(await sql.query('UPDATE ydm_meetings SET active=false,cancellation_reason=$2,cancelled_at=now(),cancelled_by=$3 WHERE id=$1 AND active=true RETURNING id,title',[id,reason,session.username]))[0]
  if(!meeting)return res.status(404).json({error:'Meeting not found or already cancelled'})
  await sql.query('INSERT INTO session_activity(username,role,section_scope,action) VALUES($1,$2,$3,$4)',[session.username,session.role,null,`Cancelled YDM meeting: ${meeting.title}; reason: ${reason}`])
  return res.status(200).json({meeting})
 }
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 if(!['district','district-ydm'].includes(session.role))return res.status(403).json({error:'Only District Super Admin or District YDM Leader can schedule a meeting'})
 const body=req.body||{},title=String(body.title||'District YDM meeting').trim(),meetUrl='https://meet.google.com/new',scheduledFor=new Date(String(body.scheduledFor||'')),attendeeEmails=[...new Set(String(body.attendeeEmails||'').split(/[\s,;]+/).map(value=>value.trim().toLowerCase()).filter(Boolean))]
 if(Number.isNaN(scheduledFor.getTime()))return res.status(400).json({error:'Choose a valid meeting date and time'})
 if(scheduledFor.getTime()<=Date.now())return res.status(400).json({error:'Meeting date and time must be later than now'})
 if(attendeeEmails.some(email=>!emailPattern.test(email)))return res.status(400).json({error:'Check the attendee email addresses'})
 const meeting=(await sql.query('INSERT INTO ydm_meetings(title,meet_url,started_by,started_role,scheduled_for,attendee_emails) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,title,meet_url,started_by,started_role,started_at,scheduled_for,attendee_emails',[title,meetUrl,session.username,session.role,scheduledFor.toISOString(),attendeeEmails]))[0]
 await sql.query('INSERT INTO session_activity(username,role,section_scope,action) VALUES($1,$2,$3,$4)',[session.username,session.role,null,`Scheduled YDM meeting: ${title}`])
 return res.status(201).json({meeting})
}
