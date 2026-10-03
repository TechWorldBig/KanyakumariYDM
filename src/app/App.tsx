import{useMemo,useState}from'react'
import{Login}from'../components/auth/Login'
import{SectionDialog}from'../components/dashboard/SectionDialog'
import{Header,Sidebar}from'../components/layout/AppShell'
import{sectionsForRole}from'../domain/permissions'
import{OverviewPage}from'../pages/OverviewPage'
import{WorkspacePage}from'../pages/WorkspacePage'
import type{Page,Section,UserRole}from'../types'
export default function App(){const[role,setRole]=useState<UserRole|null>(null),[page,setPage]=useState<Page>('Overview'),[mobile,setMobile]=useState(false),[profileOpen,setProfileOpen]=useState(false),[selectedSection,setSelectedSection]=useState<Section|null>(null);const scopedSections=useMemo(()=>role?sectionsForRole(role):[],[role]);if(!role)return <Login onLogin={nextRole=>{setRole(nextRole);setPage('Overview')}}/>;const primarySection=scopedSections[0],logout=()=>{setRole(null);setProfileOpen(false)};return <div className="app"><Sidebar role={role} section={primarySection} page={page} mobile={mobile} onNavigate={nextPage=>{setPage(nextPage);setMobile(false)}} onClose={()=>setMobile(false)} onLogout={logout}/><div className="main"><Header role={role} section={primarySection} page={page} profileOpen={profileOpen} onMenu={()=>setMobile(true)} onProfile={()=>setProfileOpen(value=>!value)} onLogout={logout}/><main className="content">{page==='Overview'?<OverviewPage role={role} sections={scopedSections} onOpen={setSelectedSection} onNavigate={setPage}/>:<WorkspacePage page={page} role={role} section={primarySection}/>}</main></div>{selectedSection&&<SectionDialog section={selectedSection} onClose={()=>setSelectedSection(null)}/>}</div>}
