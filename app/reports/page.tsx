"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Download } from "lucide-react";
import { ApiProject, fetchProjects } from "../../lib/apiClient";
import { exportToCSV, exportToPDF } from "../../lib/exportUtils";

const reportTypes = [
  "Executive Risk Summary",
  "District Risk Report",
  "Project Risk Report",
  "Delay Driver Report",
  "Intervention Report",
];

const headers = ["Project", "Project Code", "State", "District", "Risk", "Risk Score", "Delay Probability", "Land Required (ha)", "Land Acquired (ha)", "Compensation", "Legal Cases", "Primary Driver"];

export default function Reports() {
  const [projects, setProjects] = useState<ApiProject[]>([]);

  useEffect(() => {
    fetchProjects({ limit: 500 }).then(setProjects).catch(() => setProjects([]));
  }, []);

  const rows = useMemo(() => projects.map((project) => [
    project.name,
    project.project_code,
    project.state,
    project.district,
    project.risk_level || "Unclassified",
    project.risk_score ?? "",
    project.delay_probability == null ? "" : `${(project.delay_probability * 100).toFixed(1)}%`,
    project.land_required,
    project.land_acquired,
    project.compensation_status || "",
    project.legal_case_count ?? 0,
    project.primary_driver || "",
  ]), [projects]);

  const summary = useMemo(() => {
    const atRisk = projects.filter((project) => (project.risk_score ?? 0) >= 50);
    return {
      total: projects.length,
      criticalHigh: projects.filter((project) => ["Critical", "High"].includes(project.risk_level || "")).length,
      atRiskLand: atRisk.reduce((sum, project) => sum + (project.land_required || 0), 0),
      delayDays: projects.reduce((sum, project) => sum + (project.predicted_delay_days || 0), 0),
    };
  }, [projects]);

  function downloadCsv(reportType: string) {
    exportToCSV(`${reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, headers, rows);
  }

  function downloadPdf(reportType = "Executive Risk Summary") {
    exportToPDF(
      reportType,
      `Generated from ${summary.total} verified project records`,
      headers,
      rows,
      `${reportType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
      [
        { label: "Projects monitored", value: String(summary.total) },
        { label: "Critical + High", value: String(summary.criticalHigh) },
        { label: "At-risk land", value: `${summary.atRiskLand.toLocaleString("en-IN")} ha` },
      ],
    );
  }

  function preview() {
    window.print();
  }

  return (
    <div className="page">
      <div className="head">
        <div>
          <div className="eyebrow">Decision reports</div>
          <h1 className="h1">Reports</h1>
          <div className="sub">Generate downloadable risk reports from verified project records.</div>
        </div>
        <button className="btn primary" onClick={() => downloadPdf()} disabled={!projects.length}>
          <Download size={13} /> Download PDF
        </button>
      </div>
      <div className="grid cards">
        {reportTypes.map((reportType) => (
          <div className="panel" key={reportType}>
            <FileText size={22} color="#1769aa" />
            <h3 style={{ fontSize: 13 }}>{reportType}</h3>
            <p className="sub">Risk distribution, top drivers, priority interventions and portfolio exposure.</p>
            <div className="actions">
              <button className="btn primary" onClick={preview}>Preview</button>
              <button className="btn" onClick={() => downloadCsv(reportType)} disabled={!projects.length}>CSV</button>
            </div>
          </div>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="eyebrow">Printable preview</div>
        <h2>National Land Acquisition Risk Overview</h2>
        <p className="sub">Generated from {summary.total} verified project records · Data classification: project API data</p>
        <hr />
        <div className="grid three">
          <div><div className="muted">Projects monitored</div><h2>{summary.total}</h2></div>
          <div><div className="muted">Critical + High</div><h2>{summary.criticalHigh}</h2></div>
          <div><div className="muted">At-risk land</div><h2>{summary.atRiskLand.toLocaleString("en-IN")} ha</h2></div>
        </div>
        <h3>Executive assessment</h3>
        <p className="sub" style={{ lineHeight: 1.7 }}>
          The current portfolio contains {summary.criticalHigh} critical or high-risk projects, covering {summary.atRiskLand.toLocaleString("en-IN")} hectares of at-risk land. Stored project predictions indicate {summary.delayDays} cumulative predicted delay days. Use the downloaded report rows for project-level decisions.
        </p>
      </div>
    </div>
  );
}
