"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { ApiProject, fetchProjects } from "../../lib/apiClient";

type Period = "Monthly" | "Weekly" | "Quarterly";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function weekNumber(date: Date) {
  const firstDay = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - firstDay.getTime()) / 86400000 + firstDay.getUTCDay() + 1) / 7);
}

function periodLabel(date: Date, period: Period) {
  const day = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  if (period === "Monthly") return `${day} ${date.getUTCFullYear()}`;
  if (period === "Quarterly") return `Q${Math.floor(date.getUTCMonth() / 3) + 1} · ${day}`;
  return `W${weekNumber(date)} · ${day}`;
}

export default function Analytics() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [period, setPeriod] = useState<Period>("Monthly");

  useEffect(() => {
    fetchProjects({ limit: 500 }).then(setProjects).catch(() => setProjects([]));
  }, []);

  const trend = useMemo(() => {
    return projects
      .filter((project) => project.updated_at && project.risk_score != null)
      .map((project) => {
        const date = new Date(project.updated_at as string);
        return { project, date };
      })
      .filter(({ date }) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ project, date }) => ({
        label: periodLabel(date, period),
        risk: Number((project.risk_score || 0).toFixed(1)),
        project: project.name,
      }));
  }, [projects, period]);

  const district = useMemo(() => {
    const grouped = new Map<string, number[]>();
    projects.forEach((project) => {
      if (project.delay_probability == null || !project.district) return;
      grouped.set(project.district, [...(grouped.get(project.district) || []), project.delay_probability * 100]);
    });
    return Array.from(grouped, ([districtName, values]) => ({
      district: districtName.length > 14 ? `${districtName.slice(0, 14)}…` : districtName,
      probability: Number((average(values) || 0).toFixed(1)),
    })).sort((a, b) => b.probability - a.probability);
  }, [projects]);

  const metrics = useMemo(() => {
    const atRisk = projects.filter((project) => project.risk_score != null && project.risk_score >= 50);
    const compensationBacklog = projects.filter((project) => {
      const status = (project.compensation_status || "").toLowerCase();
      return status === "pending" || status === "partial" || status === "in progress";
    }).length;
    const requiredLand = projects.reduce((sum, project) => sum + (project.land_required || 0), 0);
    const acquiredLand = projects.reduce((sum, project) => sum + (project.land_acquired || 0), 0);
    const predictedDelay = average(projects.map((project) => project.predicted_delay_days).filter((value): value is number => value != null));
    const legalCases = projects.reduce((sum, project) => sum + (project.legal_case_count || 0), 0);
    const driverRisk = new Map<string, number>();
    projects.forEach((project) => {
      if (project.primary_driver) {
        driverRisk.set(project.primary_driver, (driverRisk.get(project.primary_driver) || 0) + (project.risk_score || 0));
      }
    });
    const topDriver = Array.from(driverRisk.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "No verified data";
    return {
      averagePredictedDelay: predictedDelay == null ? "No verified data" : `${predictedDelay.toFixed(0)} days`,
      compensationBacklog: `${compensationBacklog} projects`,
      acquisitionProgress: requiredLand ? `${((acquiredLand / requiredLand) * 100).toFixed(1)}% acquired` : "No verified data",
      topDriver,
      legalCases: `${legalCases} cases`,
      atRiskLand: `${atRisk.reduce((sum, project) => sum + (project.land_required || 0), 0).toLocaleString("en-IN")} ha`,
    };
  }, [projects]);

  const cards = [
    ["Average predicted delay", metrics.averagePredictedDelay, "Mean of stored predictions"],
    ["Compensation backlog", metrics.compensationBacklog, "From project compensation status"],
    ["Land acquisition progress", metrics.acquisitionProgress, "From recorded land totals"],
    ["Top delay driver", metrics.topDriver, "Highest cumulative project risk"],
    ["Legal cases", metrics.legalCases, "Sum of recorded legal cases"],
    ["At-risk land", metrics.atRiskLand, "Land in projects scoring 50+"],
  ] as const;

  return (
    <div className="page">
      <div className="head">
        <div>
          <div className="eyebrow">Portfolio intelligence</div>
          <h1 className="h1">Analytics</h1>
          <div className="sub">Risk trends, stage duration, drivers and completion forecast.</div>
        </div>
        <div className="actions">
          <select className="btn" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
            <option>Monthly</option><option>Weekly</option><option>Quarterly</option>
          </select>
          <button className="btn">Date filter</button>
        </div>
      </div>
      <div className="grid two">
        <div className="panel">
          <div className="paneltitle">Risk trends over time</div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={9} />
                <YAxis fontSize={9} />
                <Tooltip formatter={(value) => [`${value}`, "Risk score"]} />
                <Line type="monotone" dataKey="risk" name="Average risk score" stroke="#1769aa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="paneltitle">Delay probability by district</div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              {district.length === 0 ? <div className="command-empty">No verified district delay data available</div> : <BarChart data={district}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" fontSize={8} />
                <YAxis domain={[0, 100]} fontSize={9} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, "Delay probability"]} />
                <Bar dataKey="probability" name="Delay probability" fill="#7048c6" />
              </BarChart>}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid three" style={{ marginTop: 14 }}>
        {cards.map(([label, value, source]) => (
          <div className="kpi" key={label}>
            <div className="label">{label}</div>
            <div className="value" style={{ fontSize: 20 }}>{value}</div>
            <div className="trend">{source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
