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
import type { Page, Section, UserRole } from "../types";
export default function App() {
  const [role, setRole] = useState<UserRole | null>(() => {
    const saved = window.localStorage.getItem("district_role");
    return saved as UserRole | null;
  }),
    [page, setPage] = useState<Page>("Overview"),
    [mobile, setMobile] = useState(false),
    [profileOpen, setProfileOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false),
    [profile, setProfile] = useState<ProfileData>(() => {
      try {
        return JSON.parse(window.localStorage.getItem("district_profile") || '{"name":"","photo":""}');
      } catch {
        return { name: "", photo: "" };
      }
    }),
    [selectedSection, setSelectedSection] = useState<Section | null>(null),
    [addSectionOpen, setAddSectionOpen] = useState(false),
    [allSections, setAllSections] = useState<Section[]>(initialSections);
  const scopedSections = useMemo(
    () => role === "district" ? allSections : allSections.filter((_, index) => role === `section${index + 1}`),
    [role, allSections],
  );
  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!role) return;
    const heartbeat = () =>
      fetch("/api/heartbeat", { method: "POST", credentials: "include" }).catch(
        () => undefined,
      );
    heartbeat();
    const timer = window.setInterval(heartbeat, 60_000);
    return () => window.clearInterval(timer);
  }, [role]);
  if (!role)
    return (
      <Login
        onLogin={(nextRole) => {
          setRole(nextRole);
          window.localStorage.setItem("district_role", nextRole);
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
      window.localStorage.removeItem("district_role");
      setProfileOpen(false);
    };
  return (
    <div className="app">
      <Sidebar
        role={role}
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
          {page === "Overview" ? (
            <OverviewPage
              role={role}
              sections={scopedSections}
              onOpen={setSelectedSection}
              onNavigate={setPage}
              onAdd={() => setAddSectionOpen(true)}
            />
          ) : page === "Live analytics" && role === "district" ? (
            <AnalyticsPage />
          ) : (
            <WorkspacePage page={page} role={role} section={primarySection} />
          )}
        </main>
      </div>
      {selectedSection && (
        <SectionDialog
          section={selectedSection}
          onClose={() => setSelectedSection(null)}
          isDistrict={role === "district"}
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
          onSave={(nextProfile) => {
            setProfile(nextProfile);
            window.localStorage.setItem("district_profile", JSON.stringify(nextProfile));
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
