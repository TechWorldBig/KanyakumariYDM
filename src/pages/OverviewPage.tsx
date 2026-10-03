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
import type { Page, Section, UserRole } from "../types";
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
  const district = role === "district",
    churches = sections.reduce((n, s) => n + s.churches, 0),
    users = sections.reduce((n, s) => n + s.users, 0),
    health = Math.round(
      sections.reduce((n, s) => n + s.health, 0) / sections.length,
    );
  const activity = sections.flatMap((section) => [
    { title: `${section.name} church records updated`, detail: `${section.churches} churches · Today`, tone: section.tone },
    { title: `${section.name} user access reviewed`, detail: `${section.users} users · Today`, tone: section.tone },
    { title: `${section.name} report generated`, detail: `${section.town} · Today`, tone: section.tone },
  ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{dashboardDate()}</span>
          <h1>
            {greeting()}, {roleName(role)} <span className="wave">✦</span>
          </h1>
          <p className="muted">
            {district
              ? "Here is the pulse of your district today."
              : "Only your assigned section is shown."}
          </p>
        </div>
        <button className="primary" onClick={() => onNavigate("Reports")}>
          <FileText size={16} />
          View reports
        </button>
      </div>
      <div className="metrics">
        <Metric
          icon={Building2}
          label="Active sections"
          value={String(sections.length)}
          tone="blue"
        />
        <Metric
          icon={Church}
          label="Churches"
          value={String(churches)}
          tone="green"
        />
        <Metric
          icon={Users}
          label="People & users"
          value={String(users)}
          tone="orange"
        />
        <Metric
          icon={Activity}
          label="Access health"
          value={health + "%"}
          tone="violet"
        />
      </div>
      <div className="section-head">
        <div>
          <h2>
            {district ? "District overview" : sections[0].name + " overview"}
          </h2>
          <p className="muted">
            {district
              ? "All four administrative sections."
              : "This account cannot access other sections."}
          </p>
        </div>
      </div>
      <div className="section-grid">
        {sections.map((section) => (
          <SectionCard key={section.name} section={section} onOpen={onOpen} />
        ))}
        {district && (
          <button className="add-card" onClick={onAdd}>
            <div>
              <Plus size={19} />
            </div>
            <strong>Add section</strong>
          </button>
        )}
      </div>
      <div className="bottom-grid">
        <div className="panel">
          <h2>Recent activity</h2>
          <div className="activity-list">
            {activity.map((item) => (
              <div className="activity-row" key={item.title}>
                <div className={"activity-icon " + item.tone}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <span>{sections[0].name} · Today</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Access scope</h2>
          <p className="muted">
            {district
              ? "Read, write, edit and manage all four sections."
              : "Read, write, edit and manage " + sections[0].name + " only."}
          </p>
        </div>
      </div>
    </>
  );
}
