import {
  Activity,
  Building2,
  Church,
  FileText,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { roleName } from "../domain/permissions";
import { dashboardDate, greeting } from "../utils/date";
import { Metric } from "../components/shared/Metric";
import { SectionCard } from "../components/dashboard/SectionCard";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import type { Page, Section, UserRole } from "../types";
import { canWrite } from '../domain/access';

export function OverviewPage({
  role,
  sections,
  onOpen,
  onNavigate,
  onAdd,
}: {
  role: UserRole;
  sections: Section[];
  onOpen: (section: Section) => void;
  onNavigate: (page: Page) => void;
  onAdd: () => void;
}) {
  const district = role === "district";
  const churches = sections.reduce((n, s) => n + s.churches, 0);
  const users = sections.reduce((n, s) => n + s.users, 0);
  const health = Math.round(
    sections.reduce((n, s) => n + s.health, 0) / (sections.length || 1),
  );

  const activity = sections.flatMap((section) => [
    { title: `${section.name} church records verified`, detail: `${section.churches} churches · Today`, tone: section.tone },
    { title: `${section.name} user access reviewed`, detail: `${section.users} users · Today`, tone: section.tone },
    { title: `${section.name} district report synced`, detail: `${section.town} · Today`, tone: section.tone },
  ]);

  return (
    <div className="space-y-8">
      {/* Top Banner / Heading */}
      <div className="page-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow">{dashboardDate()}</span>
          <h1>
            {greeting()}, {roleName(role)} <span className="wave">✦</span>
          </h1>
          <p className="muted">
            {district
              ? "Comprehensive overview of the Kanyakumari district church network."
              : "Administrative dashboard for your assigned section."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => onNavigate("Reports")} leftIcon={<FileText size={16} />}>
            View reports
          </Button>
          {district && (
            <img
              className="overview-3d-visual hidden md:block"
              src="/assets/district-network-3d.png"
              alt="District visualization"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics">
        <Metric
          icon={Building2}
          label="Active sections"
          value={String(sections.length)}
          tone="blue"
          subtext={district ? "All district regions" : "Your assigned sector"}
        />
        <Metric
          icon={Church}
          label="Registered churches"
          value={String(churches)}
          tone="green"
          subtext="Under administrative care"
        />
        <Metric
          icon={Users}
          label="People & members"
          value={String(users)}
          tone="orange"
          subtext="Total network registry"
        />
        <Metric
          icon={Activity}
          label="Access health"
          value={`${health}%`}
          tone="violet"
          subtext="System integrity score"
        />
      </div>

      {/* Sections Directory Section */}
      <div>
        <div className="section-head mb-4">
          <div>
            <h2>
              {district ? "District Sections" : `${sections[0]?.name || 'Section'} Overview`}
            </h2>
            <p className="muted">
              {district
                ? "Administrative sections governing local church assemblies."
                : "Limited to your authorized administrative scope."}
            </p>
          </div>
        </div>

        <div className="section-grid">
          {sections.map((section) => (
            <SectionCard key={section.name} section={section} onOpen={onOpen} />
          ))}

          {district && canWrite(role, 'Sections') && (
            <button
              type="button"
              className="add-card group p-6 rounded-2xl border-2 border-dashed border-[var(--line)] hover:border-district-400 dark:hover:border-district-600 hover:bg-district-50/50 dark:hover:bg-slate-800/40 transition-all flex flex-col items-center justify-center gap-3 text-center cursor-pointer min-h-[220px]"
              onClick={onAdd}
            >
              <div className="size-12 rounded-xl bg-district-50 dark:bg-district-950/60 text-district-600 dark:text-district-400 flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                <Plus size={22} strokeWidth={2.5} />
              </div>
              <div>
                <strong className="block text-sm font-bold text-[var(--ink)]">Add new section</strong>
                <span className="text-xs text-[var(--muted)]">Expand administrative zone</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Grid: Activity & Scope */}
      <div className="bottom-grid">
        <Card className="panel">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Recent administrative activity</CardTitle>
              <Badge variant="blue">Live logs</Badge>
            </div>
            <p className="text-xs text-[var(--muted)]">Recent operations and verification events across the network.</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="activity-list space-y-1">
              {activity.map((item, index) => (
                <div
                  className="activity-row flex items-center gap-3.5 p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                  key={`${item.title}-${index}`}
                >
                  <div className={`activity-icon ${item.tone} size-9 rounded-xl flex items-center justify-center shrink-0`}>
                    <ShieldCheck size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="text-xs font-semibold text-[var(--ink)] block truncate">{item.title}</strong>
                    <span className="text-[11px] text-[var(--muted)] block">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Authorized scope</CardTitle>
              <Badge variant={district ? "success" : "secondary"}>
                {district ? "Full District" : "Section Restricted"}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted)]">Your security and delegation boundaries.</p>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line)]">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[var(--ink)]">
                <ShieldCheck size={16} className="text-district-600" />
                <span>Security Clearance: {roleName(role)}</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed m-0">
                {district
                  ? "You have administrative permission to create, edit, audit, and manage churches, users, section boundaries, and meetings across the entire Kanyakumari district."
                  : `Your access is scoped specifically to ${sections[0]?.name || 'your section'}. Cross-section mutations and global logs are isolated.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {district ? (
                <>
                  <Badge variant="outline">Global Registry</Badge>
                  <Badge variant="outline">User Provisioning</Badge>
                  <Badge variant="outline">Access Matrix</Badge>
                  <Badge variant="outline">Audit Oversight</Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline">Section Workspace</Badge>
                  <Badge variant="outline">Local Churches</Badge>
                  <Badge variant="outline">Meeting Access</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
