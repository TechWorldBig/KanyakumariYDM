import {
  Activity,
  Building2,
  CalendarCheck,
  ChevronDown,
  Church,
  ClipboardList,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  UsersRound,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { isDistrictScope, roleName } from '../../domain/permissions'
import { accessUpdatedEvent, canAccess } from '../../domain/access'
import { churches, type ChurchRecord } from '../../data/churches'
import { ChurchDialog } from '../dashboard/SectionDialog'
import type { AccountType, Page, Section, UserRole } from '../../types'
import type { ProfileData } from '../account/ProfileSettingsDialog'
import { MeetingNotifications } from './MeetingNotifications'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

const navigation = [
  ['Overview', LayoutDashboard],
  ['Live analytics', Activity],
  ['Sections', Building2],
  ['Churches', Church],
  ['Users', Users],
  ['Reports', FileText],
  ['Audit logs', ClipboardList],
  ['Access control', ShieldCheck],
  ['YDM meetings', Video],
  ['YDM attendance', CalendarCheck],
  ['Church committee', UsersRound],
  ['Sunday school', GraduationCap],
  ['Messages', MessageCircle],
] as const

export function Sidebar({
  role,
  accountType,
  section,
  page,
  mobile,
  onNavigate,
  onClose,
  onLogout,
}: {
  role: UserRole
  accountType: AccountType
  churchId: string | null
  section: Section
  page: Page
  mobile: boolean
  onNavigate: (page: Page) => void
  onClose: () => void
  onLogout: () => void
}) {
  const [, refreshAccess] = useState(0)

  useEffect(() => {
    const refresh = () => refreshAccess((value) => value + 1)
    window.addEventListener(accessUpdatedEvent, refresh)
    return () => window.removeEventListener(accessUpdatedEvent, refresh)
  }, [])

  const visibleNavigation = (
    accountType !== 'section'
      ? navigation.filter(
          ([label]) =>
            label === 'Overview' ||
            label === 'Users' ||
            label === 'YDM meetings' ||
            (label === 'YDM attendance' && canAccess(role, label)) ||
            (label === 'Church committee' && canAccess(role, label)) ||
            (label === 'Sunday school' && canAccess(role, label)) ||
            label === 'Messages'
        )
      : navigation.filter(([label]) =>
          label === 'Live analytics' || label === 'Access control'
            ? role === 'district'
            : label === 'YDM meetings' || canAccess(role, label)
        )
  ).filter(
    ([label]) =>
      accountType !== 'section'
        ? label === 'YDM attendance' || label === 'Church committee' || label === 'Sunday school'
          ? canAccess(role, label)
          : true
        : label === 'YDM meetings' || canAccess(role, label)
  )

  const workspaceName =
    accountType === 'church'
      ? 'Church Admin'
      : accountType === 'user'
      ? 'Church Member'
      : isDistrictScope(role)
      ? 'Kanyakumari'
      : section.name

  return (
    <aside className={'sidebar ' + (mobile ? 'open' : '')}>
      <div className="side-top">
        <div className="brand">
          <div className="brand-mark">
            <Church size={18} />
          </div>
          District<span className="brand-accent">OS</span>
        </div>
        <button className="close-mobile" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <div className="workspace-switch">
        <div className="workspace-icon">
          {accountType === 'church'
            ? 'CA'
            : accountType === 'user'
            ? 'CM'
            : isDistrictScope(role)
            ? 'K'
            : role.replace('section', '')}
        </div>
        <div>
          <strong>{workspaceName}</strong>
          <small>
            {accountType === 'church'
              ? 'Church workspace'
              : accountType === 'user'
              ? 'Member workspace'
              : isDistrictScope(role)
              ? 'District workspace'
              : 'Section workspace'}
          </small>
        </div>
        <ChevronDown size={15} />
      </div>

      <nav>
        {visibleNavigation.map(([label, Icon]) => (
          <button
            key={label}
            className={page === label ? 'active' : ''}
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
          <strong>Need assistance?</strong>
          <span>Enterprise administration</span>
        </div>
        <button className="profile" onClick={onLogout} title="Click to log out">
          <div className="avatar">SA</div>
          <div>
            <strong>
              {accountType === 'church'
                ? 'Church Admin'
                : accountType === 'user'
                ? 'Church Member'
                : roleName(role)}
            </strong>
            <small>
              {accountType !== 'section'
                ? 'Church workspace'
                : isDistrictScope(role)
                ? 'All sections'
                : section.name}
            </small>
          </div>
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
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
  onOpenMeeting,
}: {
  role: UserRole
  accountType: AccountType
  churchId: string | null
  section: Section
  page: Page
  profileOpen: boolean
  onMenu: () => void
  onProfile: () => void
  onSettings: () => void
  profile: ProfileData
  onLogout: () => void
  onOpenMeeting: () => void
}) {
  const scope =
    accountType !== 'section'
      ? 'Church workspace'
      : role === 'district'
      ? 'All 4 sections'
      : isDistrictScope(role)
      ? 'District workspace'
      : section.name
  const church = churchId ? churches.find((item) => item.id === churchId) : null
  const roleLabel = roleName(role)
  const hasCustomName = Boolean(
    profile.name &&
    profile.name.trim().toLowerCase() !== roleLabel.trim().toLowerCase()
  )
  const displayName = hasCustomName ? profile.name.trim() : roleLabel
  const secondaryLabel = hasCustomName
    ? roleLabel
    : profile.email ||
      profile.phone ||
      (role === 'district'
        ? 'Executive Administrator'
        : accountType === 'church'
        ? church?.name || 'Local Church Admin'
        : `${section.name} Administrator`)
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const permissionLabels =
    role === 'district'
      ? ['Read', 'Write', 'Edit', 'Manage']
      : accountType === 'church'
      ? ['Read', 'Write', 'Edit', 'Manage']
      : role === 'head-pastor'
      ? ['Read']
      : ['Read', 'Write']

  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      if (
        profileOpen &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        onProfile()
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && profileOpen) onProfile()
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileOpen, onProfile])

  const toggleTheme = () => {
    const currentTheme = document.body.dataset.theme || localStorage.getItem('district-theme') || 'system'
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
    document.body.dataset.theme = nextTheme
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    localStorage.setItem('district-theme', nextTheme)
  }

  return (
    <header>
      <button className="mobile-menu" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="breadcrumb">
        <span>{church?.name || (isDistrictScope(role) ? 'District' : section.name)}</span>
        <span>/</span>
        <strong>{page}</strong>
      </div>
      <div className="header-actions">
        {accountType === 'section' && <WorkspaceSearch role={role} section={section} />}

        <button
          type="button"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle light and dark mode"
          aria-label="Toggle theme"
        >
          <Sun size={17} className="hidden dark:block" />
          <Moon size={17} className="block dark:hidden" />
        </button>

        <MeetingNotifications onOpenMeeting={onOpenMeeting} />

        <div className="profile-menu-anchor" ref={profileRef}>
          <button
            className="header-user"
            onClick={onProfile}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <div className="avatar">
              {profile.photo ? <img src={profile.photo} alt="" /> : initials}
            </div>
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
                <div className="profile-menu-info">
                  <strong>{displayName}</strong>
                  {secondaryLabel && secondaryLabel !== displayName && (
                    <span>{secondaryLabel}</span>
                  )}
                </div>
              </div>
              <div className="profile-scope">
                <ShieldCheck size={16} />
                <div>
                  <small>Access scope</small>
                  <b>{scope}</b>
                </div>
                <em>
                  {role === 'district'
                    ? 'Full access'
                    : accountType !== 'section'
                    ? 'Church only'
                    : 'Role access'}
                </em>
              </div>
              <div className="profile-permissions">
                {permissionLabels.map((permission) => (
                  <span key={permission}>{permission}</span>
                ))}
              </div>
              <div className="profile-menu-actions">
                <button
                  className="profile-menu-item"
                  role="menuitem"
                  onClick={onSettings}
                >
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
      </div>
    </header>
  )
}

function WorkspaceSearch({ role, section }: { role: UserRole; section: Section }) {
  const [query, setQuery] = useState('')
  const [selectedChurch, setSelectedChurch] = useState<ChurchRecord | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const term = query.trim().toLowerCase()
  const accessibleChurches = isDistrictScope(role)
    ? churches
    : churches.filter((church) => church.section === section.name)
  const results = term
    ? accessibleChurches
        .filter((church) =>
          [
            church.name,
            church.address,
            church.admin,
            church.username,
            church.pastor,
            ...church.committee.map((person) => person.name),
            ...church.ydm.map((person) => person.name),
            ...church.womenMinistry.map((person) => person.name),
          ].some((value) => value.toLowerCase().includes(term))
        )
        .slice(0, 6)
    : []

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setQuery('')
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuery('')
    }
    if (query) {
      document.addEventListener('pointerdown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [query])

  const openChurch = (church: ChurchRecord) => {
    setSelectedChurch(church)
    setQuery('')
  }

  return (
    <>
      <div className="district-search" ref={searchRef}>
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search churches or people"
          aria-label="Search churches or people"
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        {query && (
          <div
            className="search-results"
            role="listbox"
            aria-label="Church search results"
          >
            {results.length ? (
              results.map((church) => (
                <button
                  type="button"
                  className="search-result"
                  key={church.id}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    openChurch(church)
                  }}
                >
                  <div className="search-result-icon">
                    <Church size={14} />
                  </div>
                  <div>
                    <strong>{church.name}</strong>
                    <span>
                      {church.section} · {church.address}
                    </span>
                  </div>
                  <span className="search-result-action">View profile</span>
                </button>
              ))
            ) : (
              <div className="search-empty">
                No church or member found in your workspace
              </div>
            )}
          </div>
        )}
      </div>
      {selectedChurch && (
        <ChurchDialog
          church={selectedChurch}
          onBack={() => setSelectedChurch(null)}
          canManageCredentials={role === 'district'}
          scopeLabel={
            isDistrictScope(role)
              ? roleName(role)
              : `${section.name} Super Admin`
          }
        />
      )}
    </>
  )
}
