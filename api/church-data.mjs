import { ensureSchema, readSession, securityHeaders, sql } from './_lib.mjs'

const catalog={
 's1-c1':{section:'Section 1',name:'Nagercoil Central Church',location:'Court Road, Nagercoil'},
 's1-c2':{section:'Section 1',name:'St. Andrew’s Church',location:'Vadasery, Nagercoil'},
 's2-c1':{section:'Section 2',name:'Kanyakumari Coast Church',location:'Kanyakumari Main Road'},
 's3-c1':{section:'Section 3',name:'Thuckalay Fellowship',location:'Main Bazaar, Thuckalay'},
 's4-c1':{section:'Section 4',name:'Marthandam West Church',location:'Marthandam Junction'}
}
const sectionForRole=role=>/^section[1-4]$/.test(role)?`Section ${role.slice(-1)}`:null
const empty=church=>({details:{name:church.name,location:church.location,totalMembers:0,totalYdmMembers:0},committee:[],ydm:[],women:[],pastor:{id:'pastor',name:'',age:'',gender:'',address:''},announcements:[]})

export default async function handler(req,res){
 securityHeaders(res)
 const session=readSession(req)
 if(!session)return res.status(401).json({error:'Sign in required'})
 const churchId=String(req.query?.churchId||req.body?.churchId||'')
 const church=catalog[churchId]
 if(!church)return res.status(404).json({error:'Church not found'})
 const sectionScope=sectionForRole(session.role)
 const scopedAccount=Boolean(session.managedRole)
 const allowed=session.role==='district'||(!scopedAccount&&sectionScope===church.section)||(scopedAccount&&session.churchId===churchId)
 if(!allowed)return res.status(403).json({error:'This church is outside your access scope'})
 await ensureSchema()
 if(req.method==='GET'){
  const row=(await sql.query('SELECT data,updated_at FROM church_workspaces WHERE church_id=$1 LIMIT 1',[churchId]))[0]
  return res.status(200).json({data:row?.data||empty(church),updatedAt:row?.updated_at||null,canManage:session.role==='district'||!scopedAccount||session.managedRole==='church'})
 }
 if(req.method!=='PUT')return res.status(405).json({error:'Method not allowed'})
 if(scopedAccount&&session.managedRole!=='church')return res.status(403).json({error:'Church Admin access required'})
 const data=req.body?.data
 if(!data||typeof data!=='object'||Array.isArray(data))return res.status(400).json({error:'Invalid church data'})
 const encoded=JSON.stringify(data)
 if(encoded.length>1500000)return res.status(413).json({error:'Church data is too large. Use photos under 500 KB.'})
 await sql.query('INSERT INTO church_workspaces(church_id,section_scope,data,updated_at) VALUES($1,$2,$3::jsonb,now()) ON CONFLICT(church_id) DO UPDATE SET section_scope=EXCLUDED.section_scope,data=EXCLUDED.data,updated_at=now()',[churchId,church.section,encoded])
 return res.status(200).json({data,updatedAt:new Date().toISOString()})
}
