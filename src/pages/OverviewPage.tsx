import {
  Activity,
  Building2,
  Church,
  FileText,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { isDistrictScope, roleName } from "../domain/permissions";
import { dashboardDate, greeting } from "../utils/date";
import { Metric } from "../components/shared/Metric";
import { SectionCard } from "../components/dashboard/SectionCard";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import type { Page, Section, UserRole } from "../types";
import { canWrite } from '../domain/access';
import { sections as fallbackSections } from '../data/sections';

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
  const list = sections && sections.length ? sections : fallbackSections;
  const district = isDistrictScope(role) || list.length > 1;
  const churches = list.reduce((n, s) => n + (s?.churches || 0), 0);
  const users = list.reduce((n, s) => n + (s?.users || 0), 0);
  const health = Math.round(
    list.reduce((n, s) => n + (s?.health || 0), 0) / (list.length || 1),
  );

  const activity = list.flatMap((section) => [
    { title: `${section.name} church records verified`, detail: `${section.churches} churches · Today`, tone: section.tone },
    { title: `${section.name} user access reviewed`, detail: `${section.users} users · Today`, tone: section.tone },
    { title: `${section.name} district report synced`, detail: `${section.town} · Today`, tone: section.tone },
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner / Heading */}
      <div className="page-heading flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">{dashboardDate()}</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1">
            {greeting()}, {roleName(role)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
            {district
              ? "Comprehensive overview of the Kanyakumari district church network."
              : `Administrative dashboard for ${list[0]?.name || 'your assigned section'}.`}
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => onNavigate("Reports")}
            leftIcon={<FileText size={15} />}
            className="shrink-0"
          >
            View reports
          </Button>
          {district && (
            <img
              className="overview-3d-visual block shrink-0"
              src="/assets/district-network-3d.png"
              alt="District visualization"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* Metrics Row (2x2 on mobile, 4 columns on desktop) */}
      <div className="metrics grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <Metric
          icon={Building2}
          label="Active sections"
          value={String(list.length)}
          tone="blue"
          subtext={district ? "All district regions" : `Assigned to ${list[0]?.name || 'your section'}`}
          badge={`${list.length} Active`}
        />
        <Metric
          icon={Church}
          label="Registered churches"
          value={String(churches)}
          tone="green"
          subtext="Under administrative care"
          badge={`${churches} Total`}
        />
        <Metric
          icon={Users}
          label="People & members"
          value={String(users)}
          tone="orange"
          subtext="Total network registry"
          badge={`${users} Verified`}
        />
        <Metric
          icon={Activity}
          label="Access health"
          value={`${health}%`}
          tone="violet"
          subtext="System integrity score"
          badge={health >= 90 ? "Optimal" : "Normal"}
        />
      </div>

      {/* Sections Directory Section */}
      <div>
        <div className="section-head mb-4">
          <div>
            <h2>
              {district ? "District Sections" : `${list[0]?.name || 'Section'} Overview`}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {district
                ? "Administrative sections governing local church assemblies."
                : `Limited to ${list[0]?.name || 'your assigned section'} administrative scope.`}
            </p>
          </div>
        </div>

        <div className="section-grid">
          {list.map((section) => (
            <SectionCard key={section.name} section={section} onOpen={onOpen} />
          ))}

          {role === 'district' && canWrite(role, 'Sections') && (
            <button
              type="button"
              className="group p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 transition-colors flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer min-h-[190px]"
              onClick={onAdd}
            >
              <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-transform group-hover:scale-105">
                <Plus size={20} strokeWidth={2.2} />
              </div>
              <div>
                <strong className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Add new section</strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Expand administrative zone</span>
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Recent operations and verification events across the network.</p>
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
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{item.detail}</span>
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Your security and delegation boundaries.</p>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--line)]">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[var(--ink)]">
                <ShieldCheck size={16} className="text-district-600" />
                <span>Security Clearance: {roleName(role)}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
                {district
                  ? "You have administrative permission to create, edit, audit, and manage churches, users, section boundaries, and meetings across the entire Kanyakumari district."
                  : `Your access is scoped specifically to ${list[0]?.name || 'your section'}. Cross-section mutations and global logs are isolated.`}
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
