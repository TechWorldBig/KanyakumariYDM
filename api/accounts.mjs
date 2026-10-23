import { ensureSchema, hashPassword, readSession, requireFeatureWrite, securityHeaders, sql } from './_lib.mjs'

const sectionName = role => /^section[1-4]$/.test(role) ? `Section ${role.slice(-1)}` : null
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req,res){
 securityHeaders(res)
 const session=readSession(req)
 if(!session)return res.status(401).json({error:'Sign in to manage accounts'})
 await ensureSchema()
 if(req.query?.mode==='access'){
  if(req.method==='GET'){
   const rows=await sql.query('SELECT role,feature,level FROM access_permissions ORDER BY role,feature')
   return res.status(200).json({permissions:rows})
  }
  if(req.method!=='PUT'||session.role!=='district')return res.status(403).json({error:'District administration required'})
  const role=String(req.body?.role||''),feature=String(req.body?.feature||''),level=String(req.body?.level||'')
  if(role.length>80||!role||!['Overview','Sections','Churches','Users','Reports','Audit logs','Live analytics','YDM meetings','YDM attendance','Church committee'].includes(feature)||!['manage','edit','view','none'].includes(level))return res.status(400).json({error:'Invalid permission'})
  await sql.query('INSERT INTO access_permissions(role,feature,level) VALUES($1,$2,$3) ON CONFLICT(role,feature) DO UPDATE SET level=EXCLUDED.level',[role,feature,level])
  return res.status(200).json({role,feature,level})
 }
 if(req.query?.mode==='profile'){
  if(req.method==='GET'){
   await sql.query("UPDATE user_profiles SET profile_role=$2 WHERE username=$1 AND (profile_role IS NULL OR profile_role='')",[session.username,session.role])
   const profile=(await sql.query('SELECT display_name AS name,phone,email,photo FROM user_profiles WHERE username=$1 LIMIT 1',[session.username]))[0]
   return res.status(200).json({profile:profile||{name:'',phone:'',email:'',photo:''}})
  }
  if(req.method!=='PUT')return res.status(405).json({error:'Method not allowed'})
  const body=req.body||{},name=String(body.name||'').trim().slice(0,80),phone=String(body.phone||'').trim().slice(0,30),email=String(body.email||'').trim().toLowerCase().slice(0,254),photo=String(body.photo||'')
  if(email&&!emailPattern.test(email))return res.status(400).json({error:'Enter a valid email address'})
  if(photo&&(!photo.startsWith('data:image/')||photo.length>1500000))return res.status(400).json({error:'Use a profile image smaller than 1 MB'})
  const profile=(await sql.query("INSERT INTO user_profiles(username,display_name,phone,email,photo,profile_role,updated_at) VALUES($1,$2,$3,$4,$5,$6,now()) ON CONFLICT(username) DO UPDATE SET display_name=EXCLUDED.display_name,phone=EXCLUDED.phone,email=EXCLUDED.email,photo=EXCLUDED.photo,profile_role=EXCLUDED.profile_role,updated_at=now() RETURNING display_name AS name,phone,email,photo",[session.username,name,phone,email,photo,session.role]))[0]
  return res.status(200).json({profile})
 }
 if(req.query?.mode==='chat-profiles'&&req.method==='GET'){
  const profiles=await sql.query("SELECT DISTINCT ON (profile_role) profile_role AS role,display_name AS name,photo FROM user_profiles WHERE profile_role IS NOT NULL AND profile_role<>'' ORDER BY profile_role,updated_at DESC")
  return res.status(200).json({profiles})
 }
 if(session.managedRole&&!['church','section'].includes(session.managedRole))return res.status(403).json({error:'Administrator access required'})
 const administratorScope=sectionName(session.role)
 if(session.role!=='district'&&!administratorScope)return res.status(403).json({error:'Administrator access required'})
 if(req.method==='GET'){
  const rows=session.role==='district'
   ? await sql.query('SELECT username,role,section_scope,church_id,created_at FROM managed_accounts ORDER BY created_at DESC')
   : await sql.query('SELECT username,role,section_scope,church_id,created_at FROM managed_accounts WHERE section_scope=$1 ORDER BY created_at DESC',[administratorScope])
  return res.status(200).json({accounts:rows})
 }
 if(req.method==='DELETE'){
  const username=String(req.body?.username||'').trim().toLowerCase()
  if(!username)return res.status(400).json({error:'Username is required'})
  const rows=session.role==='district'
   ? await sql.query('SELECT username,section_scope,role FROM managed_accounts WHERE username=$1',[username])
   : await sql.query('SELECT username,section_scope,role FROM managed_accounts WHERE username=$1 AND section_scope=$2',[username,administratorScope])
  if(!rows.length)return res.status(404).json({error:'Account not found in your scope'})
  if(!await requireFeatureWrite(session,rows[0].role==='church'?'Churches':'Users',res))return
  await sql.query('DELETE FROM managed_accounts WHERE username=$1',[username])
  await sql.query('DELETE FROM active_sessions WHERE username=$1',[username])
  await sql.query('INSERT INTO session_activity(username,role,section_scope,action) VALUES($1,$2,$3,$4)',[session.username,session.role,rows[0].section_scope,`Deleted account ${username}`])
  return res.status(204).end()
 }
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 if(!await requireFeatureWrite(session,req.body?.role==='church'?'Churches':'Users',res))return
 const body=req.body||{}
 const username=String(body.username||'').trim().toLowerCase()
 const password=String(body.password||'')
 const role=body.role==='church'?'church':'user'
 const requestedScope=String(body.section_scope||'').trim()
 const scope=session.managedRole==='church'?session.sectionScope:(session.role==='district'?requestedScope:administratorScope)
 const churchId=session.managedRole==='church'?session.churchId:String(body.church_id||'').trim()||null
 if(!scope||!/^Section [1-4]$/.test(scope))return res.status(400).json({error:'Choose a valid section'})
 if(session.managedRole==='church'&&!churchId)return res.status(400).json({error:'Church scope is missing'})
 if(session.role!=='district'&&requestedScope&&requestedScope!==administratorScope)return res.status(403).json({error:'You can only manage accounts in your section'})
 if(!/^[a-z0-9._-]{3,40}$/.test(username)||password.length<12)return res.status(400).json({error:'Use a valid username and a password of at least 12 characters'})
 await sql.query('INSERT INTO managed_accounts(username,password_hash,role,section_scope,church_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,section_scope=EXCLUDED.section_scope,church_id=EXCLUDED.church_id',[username,hashPassword(password),role,scope,churchId])
 return res.status(201).json({username,role,section_scope:scope,church_id:churchId})
}
