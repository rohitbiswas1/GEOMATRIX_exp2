'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  Gauge,
  MapPinned,
  RefreshCw,
  ShieldAlert,
  Target,
  TriangleAlert,
  Users,
} from 'lucide-react';
import {
  ApiAlert,
  ApiProject,
  DashboardSummary,
  fetchAlerts,
  fetchDashboardSummary,
  fetchModelStatus,
  fetchProjects,
  ModelStatus,
} from '../../lib/apiClient';

const riskOrder = ['Critical', 'High', 'Medium', 'Low'];
const riskClass: Record<string, string> = {
  Critical: 'risk-critical',
  High: 'risk-high',
  Medium: 'risk-medium',
  Low: 'risk-low',
};

function unavailable(value: unknown) {
  return value === null || value === undefined || value === '' ? 'No verified data available' : String(value);
}

function formatNumber(value: number | null | undefined) {
  return value === null || value === undefined ? 'No verified data available' : value.toLocaleString('en-IN');
}

function formatDate(value?: string) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function severityClass(value?: string) {
  return riskClass[value ?? ''] ?? 'risk-unknown';
}

function StatCard({ label, value, detail, icon: Icon, tone = 'blue' }: {
  label: string;
  value: React.ReactNode;
  detail: string;
  icon: typeof Activity;
  tone?: string;
}) {
  return (
    <article className={`command-stat command-stat-${tone}`}>
      <div className="command-stat-icon"><Icon size={17} /></div>
      <div className="command-stat-label">{label}</div>
      <div className="command-stat-value">{value}</div>
      <div className="command-stat-detail">{detail}</div>
    </article>
  );
}

function EmptyState({ message = 'No verified data available' }: { message?: string }) {
  return <div className="command-empty">{message}</div>;
}

export default function CommandCenter() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [model, setModel] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    setLoadError(false);
    const results = await Promise.allSettled([
      fetchDashboardSummary(),
      fetchProjects({ limit: 100 }),
      fetchAlerts('Open', 20),
      fetchModelStatus(),
    ]);
    let received = 0;
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      received += 1;
      if (index === 0) setSummary(result.value as DashboardSummary);
      if (index === 1) setProjects(result.value as ApiProject[]);
      if (index === 2) setAlerts(result.value as ApiAlert[]);
      if (index === 3) setModel(result.value as ModelStatus);
    });
    setLoadError(received === 0);
    setLastRefresh(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const derived = useMemo(() => {
    const countByRisk = (level: string) => projects.filter((project) => project.risk_level === level).length;
    const totalProjects = summary?.total_projects ?? (projects.length || null);
    const critical = summary?.critical_count ?? (projects.length ? countByRisk('Critical') : null);
    const high = summary?.high_count ?? (projects.length ? countByRisk('High') : null);
    const medium = summary?.medium_count ?? (projects.length ? countByRisk('Medium') : null);
    const low = summary?.low_count ?? (projects.length ? countByRisk('Low') : null);
    const overdue = projects.length ? projects.reduce((total, project) => total + (project.overdue_milestones ?? 0), 0) : null;
    const legal = projects.length ? projects.reduce((total, project) => total + (project.legal_case_count ?? 0), 0) : null;
    const stages = projects.reduce<Record<string, number>>((result, project) => {
      if (project.current_stage) result[project.current_stage] = (result[project.current_stage] ?? 0) + 1;
      return result;
    }, {});
    return { totalProjects, critical, high, medium, low, overdue, legal, stages };
  }, [projects, summary]);

  const atRiskProjects = useMemo(() => projects
    .filter((project) => project.risk_score !== undefined)
    .sort((a, b) => (b.risk_score ?? -1) - (a.risk_score ?? -1))
    .slice(0, 6), [projects]);

  const riskRows = [
    { label: 'Critical', value: derived.critical, icon: ShieldAlert },
    { label: 'High', value: derived.high, icon: TriangleAlert },
    { label: 'Medium', value: derived.medium, icon: AlertTriangle },
    { label: 'Low', value: derived.low, icon: CheckCircle2 },
  ];

  const modelMetrics = [
    ['Precision', model?.precision],
    ['Recall', model?.recall],
    ['F1 score', model?.f1_score],
    ['ROC-AUC', model?.roc_auc],
  ];

  return (
    <div className="command-page">
      <section className="command-hero">
        <div>
          <div className="command-kicker"><Activity size={14} /> National land acquisition monitoring</div>
          <h1>Decision support command center</h1>
          <p>Evidence-led oversight for project risk, acquisition progress, and intervention priorities.</p>
        </div>
        <div className="command-actions">
          <span className="command-refresh">{lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-IN')}` : 'Awaiting data'}</span>
          <button className="command-button command-button-secondary" onClick={() => void load()} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'command-spin' : ''} /> {refreshing ? 'Refreshing' : 'Refresh data'}
          </button>
          <Link className="command-button command-button-primary" href="/reports">Open report <ArrowUpRight size={15} /></Link>
        </div>
      </section>

      {loadError && <div className="command-system-warning"><AlertTriangle size={17} /> Data services did not return a verified response. Values below are withheld.</div>}

      {loading ? (
        <div className="command-loading"><RefreshCw size={18} className="command-spin" /> Loading verified portfolio data</div>
      ) : (
        <>
          <section className="command-stat-grid" aria-label="Portfolio summary">
            <StatCard label="Monitored projects" value={formatNumber(derived.totalProjects)} detail="Current API portfolio" icon={Target} />
            <StatCard label="Open interventions" value={formatNumber(summary?.alerts_open ?? (alerts.length || null))} detail="Alerts requiring review" icon={AlertTriangle} tone="red" />
            <StatCard label="Land required" value={summary?.total_land_ha != null ? `${summary.total_land_ha.toLocaleString('en-IN')} ha` : 'No verified data available'} detail="Reported acquisition area" icon={MapPinned} tone="amber" />
            <StatCard label="Affected families" value={formatNumber(summary?.total_families ?? (projects.length ? projects.reduce((total, project) => total + (project.affected_families ?? 0), 0) : null))} detail="Reported stakeholder count" icon={Users} tone="cyan" />
            <StatCard label="Overdue milestones" value={formatNumber(derived.overdue)} detail="Derived from project records" icon={Clock3} tone="red" />
            <StatCard label="Legal cases" value={formatNumber(derived.legal)} detail="Reported active disputes" icon={FileCheck2} tone="purple" />
          </section>

          <section className="command-primary-grid">
            <article className="command-panel command-risk-panel">
              <div className="command-panel-heading">
                <div><span className="command-overline">Portfolio exposure</span><h2>Risk triage</h2></div>
                <Gauge size={20} />
              </div>
              <div className="command-risk-total">
                <strong>{derived.totalProjects ? formatNumber(derived.totalProjects) : 'No verified data available'}</strong>
                <span>projects in current portfolio</span>
              </div>
              <div className="command-risk-rows">
                {riskRows.map(({ label, value, icon: Icon }) => (
                  <div className="command-risk-row" key={label}>
                    <span className={`command-risk-icon ${severityClass(label)}`}><Icon size={15} /></span>
                    <span className="command-risk-label">{label}</span>
                    <div className="command-risk-track"><span className={severityClass(label)} style={{ width: `${derived.totalProjects && value != null ? Math.min(100, (value / derived.totalProjects) * 100) : 0}%` }} /></div>
                    <strong>{value == null ? 'N/A' : value}</strong>
                  </div>
                ))}
              </div>
              <div className="command-panel-foot">Counts are sourced from the dashboard summary or current project records.</div>
            </article>

            <article className="command-panel command-alert-panel">
              <div className="command-panel-heading">
                <div><span className="command-overline">Action queue</span><h2>Priority interventions</h2></div>
                <Link href="/alerts" className="command-text-link">View all <ArrowUpRight size={14} /></Link>
              </div>
              {alerts.length === 0 ? <EmptyState /> : (
                <div className="command-alert-list">
                  {alerts.slice(0, 4).map((alert) => (
                    <Link href={`/projects/${alert.project_id}`} className="command-alert-item" key={alert.id}>
                      <span className={`command-severity ${severityClass(alert.severity)}`}>{alert.severity}</span>
                      <span className="command-alert-copy"><strong>{unavailable(alert.project_name)}</strong><span>{alert.reason}</span></span>
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="command-secondary-grid">
            <article className="command-panel">
              <div className="command-panel-heading"><div><span className="command-overline">Operational flow</span><h2>Acquisition pipeline</h2></div><Database size={20} /></div>
              {Object.keys(derived.stages).length === 0 ? <EmptyState /> : (
                <div className="command-stage-list">
                  {Object.entries(derived.stages).sort(([, a], [, b]) => b - a).map(([stage, count]) => (
                    <div className="command-stage-row" key={stage}><span>{stage}</span><div className="command-stage-track"><span style={{ width: `${derived.totalProjects ? (count / derived.totalProjects) * 100 : 0}%` }} /></div><strong>{count}</strong></div>
                  ))}
                </div>
              )}
              <div className="command-panel-foot">Only stages returned by the project service are shown.</div>
            </article>

            <article className="command-panel">
              <div className="command-panel-heading"><div><span className="command-overline">Explainability & provenance</span><h2>Model readiness</h2></div><Activity size={20} /></div>
              {model ? (
                <>
                  <div className={`command-model-status ${model.trained ? 'is-ready' : 'is-pending'}`}><span>{model.trained ? 'Model active' : 'Model not trained'}</span><strong>{unavailable(model.algorithm)}</strong></div>
                  <div className="command-model-grid">
                    {modelMetrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value == null ? 'Not available' : `${(value as number * 100).toFixed(1)}%`}</strong></div>)}
                  </div>
                  <p className="command-panel-foot">{unavailable(model.message)}</p>
                </>
              ) : <EmptyState />}
            </article>
          </section>

          <section className="command-panel command-table-panel">
            <div className="command-panel-heading"><div><span className="command-overline">Verified records</span><h2>Highest reported risk</h2></div><Link href="/projects" className="command-text-link">Open project register <ArrowUpRight size={14} /></Link></div>
            {atRiskProjects.length === 0 ? <EmptyState /> : (
              <div className="command-table-wrap">
                <table className="command-table"><thead><tr><th>Project</th><th>Authority</th><th>Stage</th><th>Risk</th><th>Last updated</th><th /></tr></thead><tbody>
                  {atRiskProjects.map((project) => <tr key={project.id}><td><strong>{project.name}</strong><span>{project.project_code} · {project.state}</span></td><td>{unavailable(project.authority)}</td><td>{unavailable(project.current_stage)}</td><td><span className={`command-severity ${severityClass(project.risk_level)}`}>{project.risk_score == null ? 'Not available' : `${project.risk_score.toFixed(0)} · ${project.risk_level ?? 'Unclassified'}`}</span></td><td>{formatDate(project.updated_at)}</td><td><Link href={`/projects/${project.id}`} aria-label={`Open ${project.name}`}><ArrowUpRight size={16} /></Link></td></tr>)}
                </tbody></table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
