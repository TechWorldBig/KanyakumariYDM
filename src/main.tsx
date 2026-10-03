import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, ArrowUpRight, Bell, Building2, CheckCircle2, ChevronDown, Church, ClipboardList, Eye, FileText, Gauge, Headphones, LayoutDashboard, LockKeyhole, LogOut, Menu, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Users, X } from 'lucide-react'
import './styles.css'

type Page = 'Overview' | 'Sections' | 'Churches' | 'Users' | 'Reports' | 'Audit logs'
const sections = [
  { name: 'Section 1', town: 'Nagercoil Central', admin: 'section1.admin', churches: 18, users: 74, tone: 'blue', health: 96 },
  { name: 'Section 2', town: 'Kanyakumari Coast', admin: 'section2.admin', churches: 14, users: 62, tone: 'green', health: 91 },
  { name: 'Section 3', town: 'Thuckalay North', admin: 'section3.admin', churches: 21, users: 87, tone: 'orange', health: 88 },
  { name: 'Section 4', town: 'Marthandam West', admin: 'section4.admin', churches: 16, users: 69, tone: 'violet', health: 94 },
]
const activity = [
  ['User access updated', 'Section 2 · 8 minutes ago', 'blue'], ['New church added', 'Section 3 · 42 minutes ago', 'orange'], ['Monthly report generated', 'District wide · 2 hours ago', 'green'], ['Password reset completed', 'Head Pastor · Yesterday', 'violet']
]

function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('admin'); const [password, setPassword] = useState('admin'); const [error, setError] = useState('')
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (username === 'admin' && password === 'admin') onLogin(); else setError('Use admin / admin to access the MVP.') }
  return <main className="login-shell"><div className="login-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-copy"><span className="eyebrow">Kanyakumari District</span><h1>One district.<br/><em>Every detail.</em></h1><p>A calm command center for people, places, and ministry across every section.</p><div className="art-stat"><ShieldCheck size={18}/><span>Protected by role-based access</span></div></div></div><div className="login-panel"><div className="brand"><div className="brand-mark"><Church size={19}/></div><span>District<span className="brand-accent">OS</span></span></div><div className="login-form"><span className="eyebrow">Super admin portal</span><h2>Welcome back.</h2><p className="muted">Sign in to manage the district workspace.</p><form onSubmit={submit}><label>Username<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>{error && <div className="form-error">{error}</div>}<button className="primary full" type="submit">Enter workspace <ArrowUpRight size={17}/></button></form><div className="demo-note"><LockKeyhole size={15}/><span>Demo access enabled · admin / admin</span></div></div><div className="login-footer">© 2026 Kanyakumari District · Secure workspace</div></div></main>
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false); const [page, setPage] = useState<Page>('Overview'); const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const heading = document.querySelector('.page-heading h1')
    const dateLabel = document.querySelector('.page-heading .eyebrow')
    if (dateLabel) dateLabel.textContent = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())
    if (heading?.firstChild) heading.firstChild.textContent = greeting + ', District Super Admin '
  }, [page, loggedIn])
  useEffect(() => {
    const profile = document.querySelector('.header-user')
    if (!profile || !loggedIn) return
    const toggle = () => {
      let menu = document.querySelector('.profile-menu')
      if (menu) { menu.remove(); return }
      menu = document.createElement('div')
      menu.className = 'profile-menu'
      menu.innerHTML = '<strong>District Super Admin</strong><span>Full district access</span><button class="profile-menu-item">Profile</button><button class="profile-menu-item logout-item">Log out</button>'
      document.body.appendChild(menu)
      const rect = profile.getBoundingClientRect()
      Object.assign((menu as HTMLElement).style, { top: (rect.bottom + 10) + 'px', right: (window.innerWidth - rect.right) + 'px' })
      menu.querySelector('.logout-item')?.addEventListener('click', () => { menu?.remove(); setLoggedIn(false) })
    }
    profile.addEventListener('click', toggle)
    return () => profile.removeEventListener('click', toggle)
  }, [loggedIn])
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll('.section-card'))
    cards.forEach((card, index) => {
      const openDetails = (event: Event) => {
        event.preventDefault()
        event.stopImmediatePropagation()
        const item = sections[index]
        const modal = document.createElement('div')
        modal.className = 'section-modal-backdrop'
        modal.innerHTML = '<div class="section-modal"><button class="section-modal-close">×</button><span class="eyebrow">Section workspace</span><h2>'+item.name+'</h2><p class="modal-town">'+item.town+'</p><div class="modal-admin"><div class="avatar">SA</div><div><strong>'+item.admin+'</strong><span>Section super admin · Full read, write, edit and manage access</span></div></div><div class="modal-metrics"><div><strong>'+item.churches+'</strong><span>Churches</span></div><div><strong>'+item.users+'</strong><span>Users</span></div><div><strong>'+item.health+'%</strong><span>Access health</span></div></div><h3>Recent section activity</h3><div class="modal-activity"><p><b>Church records updated</b><span>'+item.admin+' · Today</span></p><p><b>New user access granted</b><span>'+item.admin+' · Yesterday</span></p><p><b>Section report generated</b><span>'+item.name+' · This week</span></p></div><button class="primary modal-manage">Manage '+item.name+'</button></div>'
        document.body.appendChild(modal)
        modal.querySelector('.section-modal-close')?.addEventListener('click', () => modal.remove())
        modal.addEventListener('click', event => { if (event.target === modal) modal.remove() })
      }
      card.addEventListener('click', openDetails, true)
      ;(card as HTMLElement).dataset.detailListener = 'true'
    })
    return () => cards.forEach(card => card.replaceWith(card.cloneNode(true)))
  }, [page, loggedIn])
  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />
  const nav = [{ label:'Overview', icon:LayoutDashboard }, { label:'Sections', icon:Building2 }, { label:'Churches', icon:Church }, { label:'Users', icon:Users }, { label:'Reports', icon:FileText }, { label:'Audit logs', icon:ClipboardList }]
  return <div className="app"><aside className={mobile ? 'sidebar open' : 'sidebar'}><div className="side-top"><div className="brand"><div className="brand-mark"><Church size={18}/></div><span>District<span className="brand-accent">OS</span></span></div><button className="close-mobile" onClick={()=>setMobile(false)}><X size={18}/></button></div><div className="workspace-switch"><div className="workspace-icon">K</div><div><strong>Kanyakumari</strong><small>District workspace</small></div><ChevronDown size={15}/></div><nav>{nav.map(item=><button key={item.label} className={page===item.label?'active':''} onClick={()=>{setPage(item.label as Page);setMobile(false)}}><item.icon size={17}/><span>{item.label}</span>{item.label==='Users' && <b>222</b>}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><Headphones size={17}/><strong>Need a hand?</strong><span>Open the admin guide</span></div><button className="profile" onClick={()=>setLoggedIn(false)}><div className="avatar">SA</div><div><strong>District admin</strong><small>Super admin</small></div><LogOut size={15}/></button></div></aside><div className="main"><header><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu size={20}/></button><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{page}</strong></div><div className="header-actions"><button className="icon-btn"><Bell size={18}/><i/></button><div className="header-user"><div className="avatar">SA</div><span>Admin</span><ChevronDown size={14}/></div></div></header><main className="content">{page==='Overview' ? <Overview onPage={setPage}/> : <PageView page={page}/>}</main></div></div>
}

function Overview({ onPage }: { onPage: (p: Page)=>void }) { return <><div className="page-heading"><div><span className="eyebrow">Saturday, 03 October 2026</span><h1>Good morning, Admin <span className="wave">✦</span></h1><p className="muted">Here’s the pulse of your district today.</p></div><button className="primary" onClick={()=>onPage('Reports')}><FileText size={16}/> View reports <ArrowUpRight size={16}/></button></div><div className="metrics"><Metric icon={Building2} label="Active sections" value="4" detail="All systems healthy" tone="blue"/><Metric icon={Church} label="Churches" value="69" detail="+3 this month" tone="green"/><Metric icon={Users} label="People & users" value="292" detail="12 pending invites" tone="orange"/><Metric icon={Activity} label="Access health" value="94%" detail="Across all sections" tone="violet"/></div><div className="section-head"><div><h2>District overview</h2><p className="muted">A live look at your four administrative sections.</p></div><button className="subtle" onClick={()=>onPage('Sections')}>Manage sections <ArrowUpRight size={15}/></button></div><div className="section-grid">{sections.map(s=><SectionCard key={s.name} data={s}/>)}<button className="add-card" onClick={()=>onPage('Sections')}><div><Plus size={19}/></div><strong>Add section</strong><span>Set up a new district section</span></button></div><div className="bottom-grid"><div className="panel"><div className="panel-heading"><div><h2>Recent activity</h2><p className="muted">Changes across your workspace</p></div><button className="more" onClick={()=>onPage('Audit logs')}><MoreHorizontal size={18}/></button></div><div className="activity-list">{activity.map(([title,sub,tone])=><div className="activity-row" key={title}><div className={'activity-icon '+tone}><CheckCircle2 size={16}/></div><div><strong>{title}</strong><span>{sub}</span></div><ArrowUpRight size={15} className="activity-arrow"/></div>)}</div></div><div className="panel access-panel"><div className="panel-heading"><div><h2>Access snapshot</h2><p className="muted">People by permission level</p></div><button className="more"><MoreHorizontal size={18}/></button></div><div className="donut-wrap"><div className="donut"><div><strong>292</strong><span>Total users</span></div></div><div className="legend"><span><i className="dot blue"/>Admins <b>22</b></span><span><i className="dot orange"/>Viewers <b>248</b></span><span><i className="dot violet"/>Pastors <b>22</b></span></div></div></div></div></> }
function Metric({icon:Icon,label,value,detail,tone}:{icon:React.ElementType,label:string,value:string,detail:string,tone:string}) { return <div className="metric"><div className={'metric-icon '+tone}><Icon size={18}/></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div> }
function SectionCard({data:s,onOpen=(item)=>window.alert(item.name+'\n\nSuper admin: '+item.admin+'\nChurches: '+item.churches+'\nUsers: '+item.users+'\nAccess: Read · Write · Edit · Manage')}:{data:typeof sections[0],onOpen?:(s:typeof sections[0])=>void}) { return <button className={'section-card '+s.tone} onClick={()=>onOpen(s)}><div className="card-top"><div className="section-icon"><Church size={20}/></div><span className="status"><i/> Healthy</span></div><h3>{s.name}</h3><p>{s.town}</p><div className="card-stats"><span><Church size={14}/><b>{s.churches}</b> churches</span><span><Users size={14}/><b>{s.users}</b> users</span></div><div className="health"><span>Access health</span><b>{s.health}%</b><div><i style={{width:s.health+'%'}}/></div></div><span className="open-section">Open section <ArrowUpRight size={13}/></span></button> }
function PageView({page}:{page:Page}) { const title=page==='Audit logs'?'Audit logs':page; const desc=page==='Users'?'Manage access across the district.':page==='Reports'?'Review district performance and activity.':`Manage your district ${page.toLowerCase()}.`; return <><div className="page-heading"><div><span className="eyebrow">District workspace</span><h1>{title}</h1><p className="muted">{desc}</p></div><button className="primary"><Plus size={16}/> Add new</button></div><div className="placeholder panel"><div className="placeholder-icon"><Gauge size={28}/></div><h2>{page} workspace</h2><p>This MVP area is ready for your workflow. Use the Overview to see all sections and access health.</p><button className="subtle"><Search size={15}/> Explore data</button></div></> }
function RoleAccess({onPage}:{onPage:(p:Page)=>void}) { return <div className="panel access-table-panel"><div className="panel-heading"><div><h2>Super admin access map</h2><p className="muted">Every super admin has full read, write, edit, and manage access within their scope.</p></div><button className="subtle" onClick={()=>onPage('Users')}><Users size={14}/> Manage users</button></div><div className="role-table"><div className="role-row role-header"><span>Role</span><span>Scope</span><span>Permissions</span><span>Status</span></div><div className="role-row"><strong><ShieldCheck size={14}/> District super admin</strong><span>All 4 sections</span><span className="permission"><b>Read</b><b>Write</b><b>Edit</b><b>Manage</b></span><em>Full access</em></div>{sections.map(s=><div className="role-row" key={s.name}><strong><Building2 size={14}/> {s.name} super admin</strong><span>{s.name} only</span><span className="permission"><b>Read</b><b>Write</b><b>Edit</b><b>Manage</b></span><em>Full access</em></div>)}</div></div> }
createRoot(document.getElementById('root')!).render(<App />)
