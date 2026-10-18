import { useEffect, useMemo, useState } from "react";
import { Login } from "../components/auth/Login";
import { SectionDialog } from "../components/dashboard/SectionDialog";
import { AddSectionDialog } from "../components/dashboard/AddSectionDialog";
import { Header, Sidebar } from "../components/layout/AppShell";
import { sections as initialSections } from "../data/sections";
import { OverviewPage } from "../pages/OverviewPage";
import { WorkspacePage } from "../pages/WorkspacePage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { ProfileSettingsDialog } from "../components/account/ProfileSettingsDialog";
import type { ProfileData } from "../components/account/ProfileSettingsDialog";
import type { AccountType, Page, Section, UserRole } from "../types";
import { ChurchAdminPage } from "../pages/ChurchAdminPage";
import { AuditLogsPage } from "../pages/AuditLogsPage";
import { YdmMeetingsPage } from "../pages/YdmMeetingsPage";
import { MessagesPage } from "../pages/MessagesPage";
import { isDistrictScope } from "../domain/permissions";
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
  const scopedSections = useMemo(
    () => role && isDistrictScope(role) ? allSections : allSections.filter((_, index) => role === `section${index + 1}`),
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
    heartbeat(true);
    const timer = window.setInterval(() => heartbeat(true), 20_000);
    window.addEventListener("focus", refreshPresence);
    window.addEventListener("online", refreshPresence);
    document.addEventListener("visibilitychange", refreshPresence);
    document.addEventListener("pointerdown", recordActivity, { passive: true });
    document.addEventListener("keydown", recordActivity);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshPresence);
      window.removeEventListener("online", refreshPresence);
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
  const primarySection = scopedSections[0],
    logout = () => {
      fetch("/api/logout", { method: "POST", credentials: "include" }).catch(
        () => undefined,
      );
      setRole(null);
      setAccountType("section");
      setChurchId(null);
      setProfile({ name: "", photo: "", phone: "", email: "" });
      setProfileOpen(false);
    };
  return (
    <div className="app">
      <Sidebar
        role={role}
        accountType={accountType}
        churchId={churchId}
        section={primarySection}
        page={page}
        mobile={mobile}
        onNavigate={(nextPage) => {
          setPage(nextPage);
          setMobile(false);
        }}
        onClose={() => setMobile(false)}
        onLogout={logout}
      />
      <div className="main">
        <Header
          role={role}
          accountType={accountType}
          churchId={churchId}
          section={primarySection}
          page={page}
          profileOpen={profileOpen}
          onMenu={() => setMobile(true)}
          onProfile={() => setProfileOpen((value) => !value)}
          onSettings={() => {
            setProfileOpen(false);
            setSettingsOpen(true);
          }}
          profile={profile}
          onLogout={logout}
        />
        <main className="content">
          {accountType !== "section" && churchId ? (
            <ChurchAdminPage churchId={churchId} canManage={accountType === "church"} />
          ) : page === "Overview" ? (
            <OverviewPage
              role={role}
              sections={scopedSections}
              onOpen={setSelectedSection}
              onNavigate={setPage}
              onAdd={() => setAddSectionOpen(true)}
            />
          ) : page === "Audit logs" ? (
            <AuditLogsPage role={role} />
          ) : page === "YDM meetings" ? (
            <YdmMeetingsPage role={role} />
          ) : page === "Messages" ? (
            <MessagesPage role={role} />
          ) : page === "Live analytics" && role === "district" ? (
            <AnalyticsPage />
          ) : (
            <WorkspacePage
              page={page}
              role={role}
              section={primarySection}
              sections={scopedSections}
              onAddSection={() => setAddSectionOpen(true)}
              onOpenSection={setSelectedSection}
            />
          )}
        </main>
      </div>
      {selectedSection && (
        <SectionDialog
          section={selectedSection}
          onClose={() => setSelectedSection(null)}
          isDistrict={role === "district"}
          canManageCredentials={role === "district" || /^section[1-4]$/.test(role)}
          canEditSection={role === "district" || selectedSection.name === scopedSections[0]?.name}
          onSaveSection={(nextSection) => { setAllSections((current) => current.map((item) => item.name === selectedSection.name ? nextSection : item)); setSelectedSection(nextSection); }}
          onRemove={() => {
            setAllSections((current) =>
              current.filter((item) => item.name !== selectedSection.name),
            );
            setSelectedSection(null);
          }}
        />
      )}
      {addSectionOpen && (
        <AddSectionDialog
          onClose={() => setAddSectionOpen(false)}
          onCreate={(section) => {
            setAllSections((current) => [...current, section]);
            setAddSectionOpen(false);
          }}
        />
      )}
      {settingsOpen && (
        <ProfileSettingsDialog
          role={role}
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onSave={async (nextProfile) => {
            const response = await fetch("/api/accounts?mode=profile", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextProfile) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Profile could not be saved");
            setProfile(result.profile);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
