import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Login } from "../components/auth/Login";
import { SectionDialog } from "../components/dashboard/SectionDialog";
import { AddSectionDialog } from "../components/dashboard/AddSectionDialog";
import { Header, Sidebar } from "../components/layout/AppShell";
import { sections as initialSections } from "../data/sections";
import { OverviewPage } from "../pages/OverviewPage";
import { WorkspacePage } from "../pages/WorkspacePage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import type { ProfileData } from "../components/account/ProfileSettingsDialog";
import type { AccountType, Page, Section, UserRole } from "../types";
import { ChurchAdminPage } from "../pages/ChurchAdminPage";
import { AuditLogsPage } from "../pages/AuditLogsPage";
import { YdmMeetingsPage } from "../pages/YdmMeetingsPage";
import { YdmAttendancePage } from "../pages/YdmAttendancePage";
import { ChurchCommitteePage } from "../pages/ChurchCommitteePage";
import { SundaySchoolPage } from "../pages/SundaySchoolPage";
import { MessagesPage } from "../pages/MessagesPage";
import { isDistrictScope } from "../domain/permissions";
import { accessUpdatedEvent, canWrite, refreshAccess } from '../domain/access';

const PAGE_TO_HASH: Record<Page, string> = {
  Overview: '',
  'Live analytics': 'live-analytics',
  Sections: 'sections',
  Churches: 'churches',
  Users: 'users',
  Reports: 'reports',
  'Audit logs': 'audit-logs',
  'Access control': 'access-control',
  'YDM meetings': 'ydm-meetings',
  'YDM attendance': 'ydm-attendance',
  'Church committee': 'church-committee',
  'Sunday school': 'sunday-school',
  Messages: 'messages',
}

const HASH_TO_PAGE: Record<string, Page> = {
  '': 'Overview',
  overview: 'Overview',
  'live-analytics': 'Live analytics',
  sections: 'Sections',
  churches: 'Churches',
  users: 'Users',
  reports: 'Reports',
  'audit-logs': 'Audit logs',
  'access-control': 'Access control',
  'ydm-meetings': 'YDM meetings',
  'ydm-attendance': 'YDM attendance',
  'church-committee': 'Church committee',
  'sunday-school': 'Sunday school',
  messages: 'Messages',
}

const ProfileSettingsDialog = lazy(() => import('../components/account/ProfileSettingsDialog').then((module) => ({ default: module.ProfileSettingsDialog })));
export default function App() {
  const [role, setRole] = useState<UserRole | null>(null),
    [accountType, setAccountType] = useState<AccountType>("section"),
    [churchId, setChurchId] = useState<string | null>(null),
    [authReady, setAuthReady] = useState(false),
    [page, setPage] = useState<Page>("Overview"),
    [mobile, setMobile] = useState(false),
    [profileOpen, setProfileOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false),
    [profile, setProfile] = useState<ProfileData>({ name: "", photo: "", phone: "", email: "" }),
    [selectedSection, setSelectedSection] = useState<Section | null>(null),
    [addSectionOpen, setAddSectionOpen] = useState(false),
    [allSections, setAllSections] = useState<Section[]>(initialSections);
  const [, setAccessVersion] = useState(0);
  useEffect(() => {
    if (!role) return;
    const update = () => setAccessVersion(value => value + 1);
    window.addEventListener(accessUpdatedEvent, update);
    void refreshAccess().catch(() => undefined);
    return () => window.removeEventListener(accessUpdatedEvent, update);
  }, [role]);
  const scopedSections = useMemo(
    () => {
      if (!role) return allSections;
      if (isDistrictScope(role)) return allSections;
      const filtered = allSections.filter((_, index) => role === `section${index + 1}`);
      return filtered.length ? filtered : [allSections[0] || initialSections[0]];
    },
    [role, allSections],
  );
  useEffect(() => {
    fetch("/api/session", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((session: { role: UserRole; accountType?: AccountType; churchId?: string | null } | null) => { if (session?.role) { setRole(session.role); setAccountType(session.accountType || "section"); setChurchId(session.churchId || null); } })
      .catch(() => undefined)
      .finally(() => setAuthReady(true));
  }, []);
  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!role) return;
    let lastHeartbeat = 0;
    const heartbeat = (force = false) => {
      const now = Date.now();
      if (!force && now - lastHeartbeat < 15_000) return;
      lastHeartbeat = now;
      fetch("/api/heartbeat", { method: "POST", credentials: "include" }).catch(
        () => undefined,
      );
    };
    const refreshPresence = () => {
      if (document.visibilityState === "visible") heartbeat(true);
    };
    const recordActivity = () => heartbeat();
    const leavePresence = () => {
      const url = "/api/heartbeat?offline=1";
      if (!navigator.sendBeacon(url)) {
        void fetch(url, { method: "POST", credentials: "include", keepalive: true });
      }
    };
    heartbeat(true);
    const timer = window.setInterval(() => heartbeat(true), 20_000);
    window.addEventListener("focus", refreshPresence);
    window.addEventListener("online", refreshPresence);
    window.addEventListener("pagehide", leavePresence);
    document.addEventListener("visibilitychange", refreshPresence);
    document.addEventListener("pointerdown", recordActivity, { passive: true });
    document.addEventListener("keydown", recordActivity);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshPresence);
      window.removeEventListener("online", refreshPresence);
      window.removeEventListener("pagehide", leavePresence);
      document.removeEventListener("visibilitychange", refreshPresence);
      document.removeEventListener("pointerdown", recordActivity);
      document.removeEventListener("keydown", recordActivity);
    };
  }, [role]);
  useEffect(() => {
    if (!role) return;
    setProfile({ name: "", photo: "", phone: "", email: "" });
    fetch("/api/accounts?mode=profile", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => result?.profile && setProfile({ name: result.profile.name || "", photo: result.profile.photo || "", phone: result.profile.phone || "", email: result.profile.email || "" }))
      .catch(() => undefined);
  }, [role]);

  const primarySection = scopedSections[0] || allSections[0] || initialSections[0];

  const safeHistoryPush = (state: Record<string, unknown>, url?: string) => {
    try {
      window.history.pushState(state, '', url || window.location.hash || window.location.pathname);
    } catch {
      // browser blocked state push
    }
  };

  const safeHistoryReplace = (state: Record<string, unknown>, url?: string) => {
    try {
      window.history.replaceState(state, '', url || window.location.pathname);
    } catch {
      // browser blocked state replace
    }
  };

  const navigateTo = (nextPage: Page) => {
    if (nextPage === page) {
      closeMobileDrawer();
      return;
    }
    const currentDepth = (window.history.state?.depth as number) || 0;
    if (nextPage === 'Overview') {
      safeHistoryReplace({ page: 'Overview', depth: 0 }, window.location.pathname);
      setPage('Overview');
      setMobile(false);
      return;
    }
    const hash = PAGE_TO_HASH[nextPage];
    const targetUrl = hash ? `#${hash}` : window.location.pathname;
    const newDepth = currentDepth + 1;
    safeHistoryPush({ page: nextPage, depth: newDepth }, targetUrl);
    setPage(nextPage);
    setMobile(false);
  };

  const openMobileDrawer = () => {
    const currentDepth = (window.history.state?.depth as number) || 0;
    safeHistoryPush({ page, depth: currentDepth + 1, overlay: 'drawer' }, window.location.hash || window.location.pathname);
    setMobile(true);
  };

  const closeMobileDrawer = () => {
    if (window.history.state?.overlay === 'drawer') {
      try { window.history.back(); } catch { setMobile(false); }
    } else {
      setMobile(false);
    }
  };

  const openSectionModal = (sec: Section) => {
    const currentDepth = (window.history.state?.depth as number) || 0;
    safeHistoryPush({ page, depth: currentDepth + 1, overlay: 'section' }, window.location.hash || window.location.pathname);
    setSelectedSection(sec);
  };

  const closeSectionModal = () => {
    if (window.history.state?.overlay === 'section') {
      try { window.history.back(); } catch { setSelectedSection(null); }
    } else {
      setSelectedSection(null);
    }
  };

  const openAddSectionModal = () => {
    const currentDepth = (window.history.state?.depth as number) || 0;
    safeHistoryPush({ page, depth: currentDepth + 1, overlay: 'add-section' }, window.location.hash || window.location.pathname);
    setAddSectionOpen(true);
  };

  const closeAddSectionModal = () => {
    if (window.history.state?.overlay === 'add-section') {
      try { window.history.back(); } catch { setAddSectionOpen(false); }
    } else {
      setAddSectionOpen(false);
    }
  };

  const openSettingsModal = () => {
    setProfileOpen(false);
    const currentDepth = (window.history.state?.depth as number) || 0;
    safeHistoryPush({ page, depth: currentDepth + 1, overlay: 'settings' }, window.location.hash || window.location.pathname);
    setSettingsOpen(true);
  };

  const closeSettingsModal = () => {
    if (window.history.state?.overlay === 'settings') {
      try { window.history.back(); } catch { setSettingsOpen(false); }
    } else {
      setSettingsOpen(false);
    }
  };

  // Mobile Back Button and PopState Synchronizer (Hooks called unconditionally)
  useEffect(() => {
    if (!role) return;

    const initialHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    const initialPage = HASH_TO_PAGE[initialHash] || 'Overview';

    if (initialPage !== 'Overview') {
      safeHistoryReplace({ page: 'Overview', depth: 0 }, window.location.pathname);
      safeHistoryPush({ page: initialPage, depth: 1 }, `#${PAGE_TO_HASH[initialPage]}`);
      setPage(initialPage);
    } else {
      safeHistoryReplace({ page: 'Overview', depth: 0 }, window.location.pathname);
      setPage('Overview');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as { page?: Page; depth?: number; overlay?: string } | null;

      if (!state?.overlay) {
        setMobile(false);
        setSelectedSection(null);
        setAddSectionOpen(false);
        setSettingsOpen(false);
      }

      const hashPage = HASH_TO_PAGE[window.location.hash.replace(/^#\/?/, '').trim().toLowerCase()] || 'Overview';
      const targetPage = state?.page || hashPage;
      setPage(targetPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [role]);

  const logout = () => {
    fetch("/api/logout", { method: "POST", credentials: "include" }).catch(
      () => undefined,
    );
    setRole(null);
    setAccountType("section");
    setChurchId(null);
    setProfile({ name: "", photo: "", phone: "", email: "" });
    setProfileOpen(false);
    safeHistoryReplace({ page: 'Overview', depth: 0 }, window.location.pathname);
  };

  if (!authReady) return <main className="auth-loading" aria-label="Checking secure session" />;
  if (!role)
    return (
      <Login
        onLogin={(session) => {
          setRole(session.role);
          setAccountType(session.accountType || "section");
          setChurchId(session.churchId || null);
          setProfile({ name: "", photo: "", phone: "", email: "" });
          setPage("Overview");
        }}
      />
    );

  return (
    <div className={page === "Messages" ? "app messages-app" : "app"}>
      {mobile && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          onClick={closeMobileDrawer}
          aria-label="Close navigation menu"
        />
      )}
      <Sidebar
        role={role}
        accountType={accountType}
        churchId={churchId}
        section={primarySection}
        page={page}
        mobile={mobile}
        profile={profile}
        onNavigate={navigateTo}
        onClose={closeMobileDrawer}
        onLogout={logout}
      />
      <div className={page === "Messages" ? "main messages-main" : "main"}>
        <Header
          role={role}
          accountType={accountType}
          churchId={churchId}
          section={primarySection}
          page={page}
          profileOpen={profileOpen}
          onMenu={openMobileDrawer}
          onProfile={() => setProfileOpen((value) => !value)}
          onSettings={openSettingsModal}
          profile={profile}
          onLogout={logout}
          onOpenMeeting={() => { navigateTo('YDM meetings'); setProfileOpen(false); }}
        />
        <AnimatePresence mode="wait">
          <motion.main
            key={page + (accountType !== "section" ? churchId || "" : "")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={page === "Messages" ? "content messages-content" : "content"}
          >
            {page === "YDM meetings" ? (
              <YdmMeetingsPage role={role} />
            ) : page === "YDM attendance" ? (
              <YdmAttendancePage role={role} />
            ) : page === "Church committee" ? (
              <ChurchCommitteePage role={role} accountType={accountType} churchId={churchId} />
            ) : page === "Sunday school" ? (
              <SundaySchoolPage role={role} accountType={accountType} churchId={churchId} />
            ) : page === "Messages" ? (
              <MessagesPage role={role} />
            ) : accountType !== "section" && churchId ? (
              <ChurchAdminPage churchId={churchId} canManage={accountType === "church" && canWrite(role, 'Churches')} />
            ) : page === "Overview" ? (
              <OverviewPage
                role={role}
                sections={scopedSections}
                onOpen={openSectionModal}
                onNavigate={navigateTo}
                onAdd={() => { if (canWrite(role, 'Sections')) openAddSectionModal(); }}
              />
            ) : page === "Audit logs" ? (
              <AuditLogsPage role={role} />
            ) : page === "Live analytics" && role === "district" ? (
              <AnalyticsPage />
            ) : (
              <WorkspacePage
                page={page}
                role={role}
                section={primarySection}
                sections={scopedSections}
                onAddSection={() => { if (canWrite(role, 'Sections')) openAddSectionModal(); }}
                onOpenSection={openSectionModal}
              />
            )}
          </motion.main>
        </AnimatePresence>
      </div>
      {selectedSection && (
        <SectionDialog
          section={selectedSection}
          onClose={closeSectionModal}
          isDistrict={role === "district"}
          canManageCredentials={(role === "district" || /^section[1-4]$/.test(role)) && canWrite(role, 'Sections') && canWrite(role, 'Churches')}
          canEditSection={(role === "district" || selectedSection.name === scopedSections[0]?.name) && canWrite(role, 'Sections')}
          canDeleteSection={role === 'district' && canWrite(role, 'Sections')}
          onSaveSection={(nextSection) => { if (!canWrite(role, 'Sections')) return; setAllSections((current) => current.map((item) => item.name === selectedSection.name ? nextSection : item)); setSelectedSection(nextSection); }}
          onRemove={() => { if (!canWrite(role, 'Sections')) return;
            setAllSections((current) =>
              current.filter((item) => item.name !== selectedSection.name),
            );
            setSelectedSection(null);
          }}
        />
      )}
      {addSectionOpen && canWrite(role, 'Sections') && (
        <AddSectionDialog
          onClose={closeAddSectionModal}
          onCreate={(section) => {
            setAllSections((current) => [...current, section]);
            setAddSectionOpen(false);
          }}
        />
      )}
      {settingsOpen && <Suspense fallback={null}><ProfileSettingsDialog
        role={role}
        profile={profile}
        onClose={closeSettingsModal}
        onSave={async (nextProfile) => {
          const response = await fetch("/api/accounts?mode=profile", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextProfile) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Profile could not be saved");
          setProfile(result.profile);
          setSettingsOpen(false);
        }}
      /></Suspense>}
    </div>
  );
}
