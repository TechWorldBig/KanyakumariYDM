import { ensureSchema, hashPassword, readSession, securityHeaders, sql } from './_lib.mjs'

const sectionName = role => /^section[1-4]$/.test(role) ? `Section ${role.slice(-1)}` : null

export default async function handler(req,res){
 securityHeaders(res)
 const session=readSession(req)
 if(!session)return res.status(401).json({error:'Sign in to manage accounts'})
 if(session.managedRole)return res.status(403).json({error:'Super Admin access required'})
 const administratorScope=sectionName(session.role)
 if(session.role!=='district'&&!administratorScope)return res.status(403).json({error:'Administrator access required'})
 await ensureSchema()
 if(req.method==='GET'){
  const rows=session.role==='district'
   ? await sql.query('SELECT username,role,section_scope,created_at FROM managed_accounts ORDER BY created_at DESC')
   : await sql.query('SELECT username,role,section_scope,created_at FROM managed_accounts WHERE section_scope=$1 ORDER BY created_at DESC',[administratorScope])
  return res.status(200).json({accounts:rows})
 }
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 const body=req.body||{}
 const username=String(body.username||'').trim().toLowerCase()
 const password=String(body.password||'')
 const role=body.role==='church'?'church':'user'
 const requestedScope=String(body.section_scope||'').trim()
 const scope=session.role==='district'?requestedScope:administratorScope
 if(!scope||!/^Section [1-4]$/.test(scope))return res.status(400).json({error:'Choose a valid section'})
 if(session.role!=='district'&&requestedScope&&requestedScope!==administratorScope)return res.status(403).json({error:'You can only manage accounts in your section'})
 if(!/^[a-z0-9._-]{3,40}$/.test(username)||password.length<12)return res.status(400).json({error:'Use a valid username and a password of at least 12 characters'})
 await sql.query('INSERT INTO managed_accounts(username,password_hash,role,section_scope) VALUES($1,$2,$3,$4) ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,section_scope=EXCLUDED.section_scope',[username,hashPassword(password),role,scope])
 return res.status(201).json({username,role,section_scope:scope})
}
