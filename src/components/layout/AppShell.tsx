import {
  Activity,
  Bell,
  Building2,
  ChevronDown,
  Church,
  ClipboardList,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { roleName } from "../../domain/permissions";
import { sections } from "../../data/sections";
import { churches, type ChurchRecord } from "../../data/churches";
import { ChurchDialog } from "../dashboard/SectionDialog";
import type { AccountType, Page, Section, UserRole } from "../../types";
import type { ProfileData } from "../account/ProfileSettingsDialog";
const navigation = [
  ["Overview", LayoutDashboard],
  ["Live analytics", Activity],
  ["Sections", Building2],
  ["Churches", Church],
  ["Users", Users],
  ["Reports", FileText],
  ["Audit logs", ClipboardList],
] as const;
export function Sidebar({
  role,
  accountType,
  churchId,
  section,
  page,
  mobile,
  onNavigate,
  onClose,
  onLogout,
}: {
  role: UserRole;
  accountType: AccountType;
  churchId: string | null;
  section: Section;
  page: Page;
  mobile: boolean;
  onNavigate: (page: Page) => void;
  onClose: () => void;
  onLogout: () => void;
}) {
  const visibleNavigation =
    accountType !== "section" ? navigation.filter(([label]) => label === "Overview" || label === "Users") : role === "district"
      ? navigation
      : navigation.filter(([label]) => label !== "Live analytics");
  const workspaceName = accountType === "church" ? "Church Admin" : accountType === "user" ? "Church Member" : role === "district" ? "Kanyakumari" : section.name;
  return (
    <aside className={"sidebar " + (mobile ? "open" : "")}>
      <div className="side-top">
        <div className="brand">
          <div className="brand-mark">
            <Church size={18} />
          </div>
          District<span className="brand-accent">OS</span>
        </div>
        <button
          className="close-mobile"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      <div className="workspace-switch">
        <div className="workspace-icon">
          {accountType === "church" ? "CA" : accountType === "user" ? "CM" : role === "district" ? "K" : role.replace("section", "")}
        </div>
        <div>
          <strong>{workspaceName}</strong>
          <small>
            {accountType === "church" ? "Church workspace" : accountType === "user" ? "Member workspace" : role === "district" ? "District workspace" : "Section workspace"}
          </small>
        </div>
        <ChevronDown size={15} />
      </div>
      <nav>
        {visibleNavigation.map(([label, Icon]) => (
          <button
            key={label}
            className={page === label ? "active" : ""}
            onClick={() => onNavigate(label)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <Headphones size={17} />
          <strong>Need a hand?</strong>
          <span>Open the admin guide</span>
        </div>
        <button className="profile" onClick={onLogout}>
          <div className="avatar">SA</div>
          <div>
            <strong>{accountType === "church" ? "Church Admin" : accountType === "user" ? "Church Member" : roleName(role)}</strong>
            <small>{accountType !== "section" ? "Church workspace" : role === "district" ? "All sections" : section.name}</small>
          </div>
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
export function Header({
  role,
  accountType,
  churchId,
  section,
  page,
  profileOpen,
  onMenu,
  onProfile,
  onSettings,
  profile,
  onLogout,
}: {
  role: UserRole;
  accountType: AccountType;
  churchId: string | null;
  section: Section;
  page: Page;
  profileOpen: boolean;
  onMenu: () => void;
  onProfile: () => void;
  onSettings: () => void;
  profile: ProfileData;
  onLogout: () => void;
}) {
  const scope = accountType !== "section" ? "Church workspace" : role === "district" ? "All 4 sections" : section.name;
  const church = churchId ? churches.find(item => item.id === churchId) : null;
  const displayName = accountType === "church" ? "Church Admin" : accountType === "user" ? "Church Member" : profile.name || roleName(role);
  const initials = accountType === "church" ? "CA" : accountType === "user" ? "CM" : "SA";
  return (
    <header>
      <button className="mobile-menu" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="breadcrumb">
        <span>{church?.name || (role === "district" ? "District" : section.name)}</span>
        <span>/</span>
        <strong>{page}</strong>
      </div>
      <div className="header-actions">
        {accountType === "section" && <WorkspaceSearch role={role} section={section} />}
        <button className="icon-btn" aria-label="Notifications" disabled>
          <Bell size={18} />
        </button>
        <button
          className="header-user"
          onClick={onProfile}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
        >
          <div className="avatar">{profile.photo ? <img src={profile.photo} alt="" /> : initials}</div>
          <span>{displayName}</span>
          <ChevronDown size={14} />
        </button>
        {profileOpen && (
          <div className="profile-menu" role="menu">
            <div className="profile-menu-head">
              <div className="profile-menu-avatar">
                {profile.photo ? <img src={profile.photo} alt="" /> : initials}
                <i />
              </div>
              <div>
                <strong>{displayName}</strong>
                <span>{accountType === "church" ? "Church administrator" : accountType === "user" ? "Church member" : "Administrator account"}</span>
              </div>
            </div>
            <div className="profile-scope">
              <ShieldCheck size={16} />
              <div>
                <small>Access scope</small>
                <b>{scope}</b>
              </div>
              <em>{accountType === "section" ? "Full access" : "Church only"}</em>
            </div>
            <div className="profile-permissions">
              <span>Read</span><span>Write</span><span>Edit</span>{accountType === "church" && <span>Manage</span>}
            </div>
            <div className="profile-menu-actions">
              <button className="profile-menu-item" role="menuitem" onClick={onSettings}>
                <Settings size={16} />
                <span>
                  <b>Profile settings</b>
                  <small>Account and preferences</small>
                </span>
              </button>
              <button
                className="profile-menu-item logout-item"
                onClick={onLogout}
                role="menuitem"
              >
                <LogOut size={16} />
                <span>
                  <b>Log out</b>
                  <small>Return to secure login</small>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
function WorkspaceSearch({ role, section }: { role: UserRole; section: Section }) {
  const [query, setQuery] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<ChurchRecord | null>(null);
  const term = query.trim().toLowerCase();
  const accessibleChurches = role === "district" ? churches : churches.filter((church) => church.section === section.name);
  const results = term
    ? accessibleChurches.filter((church) => [
        church.name,
        church.address,
        church.admin,
        church.username,
        church.pastor,
        ...church.committee.map((person) => person.name),
        ...church.ydm.map((person) => person.name),
        ...church.womenMinistry.map((person) => person.name),
      ].some((value) => value.toLowerCase().includes(term))).slice(0, 6)
    : [];
  const openChurch = (church: ChurchRecord) => {
    setSelectedChurch(church);
    setQuery("");
  };
  return <>
    <div className="district-search">
      <Search size={15}/>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search churches or people" aria-label="Search churches or people" />
      {query && <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">?</button>}
      {query && <div className="search-results" role="listbox" aria-label="Church search results">
        {results.length ? results.map((church) => <button type="button" className="search-result" key={church.id} onClick={(event) => { event.preventDefault(); event.stopPropagation(); openChurch(church); }}>
          <div className="search-result-icon"><Church size={14}/></div>
          <div><strong>{church.name}</strong><span>{church.section} ? {church.address}</span></div>
          <span className="search-result-action">View profile</span>
        </button>) : <div className="search-empty">No church or member found in your workspace</div>}
      </div>}
    </div>
    {selectedChurch && <ChurchDialog church={selectedChurch} onBack={() => setSelectedChurch(null)} canManageCredentials scopeLabel={role === "district" ? "District Super Admin" : `${section.name} Super Admin`} />}
  </>;
}
