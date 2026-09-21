"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Layers, Search, SlidersHorizontal, MapPin } from "lucide-react";
import { fetchProjects, ApiProject } from "../../lib/apiClient";

type GoogleMaps = any;
type GoogleMap = any;
type GoogleMarker = any;

const STATE_CENTER_COORDS: Record<string, [number, number]> = {
  "andhra pradesh": [15.9129, 79.74],
  telangana: [18.1124, 79.0193],
  odisha: [20.9517, 85.0985],
  bihar: [25.0961, 85.3131],
  punjab: [31.1471, 75.3412],
  delhi: [28.7041, 77.1025],
  gujarat: [22.2587, 71.1924],
  karnataka: [15.3173, 75.7139],
  "west bengal": [22.9868, 87.855],
  maharashtra: [19.7515, 75.7139],
  chhattisgarh: [21.2787, 81.8661],
  uttarakhand: [30.0668, 79.0193],
};

function loadGoogleMaps(apiKey: string): Promise<GoogleMaps> {
  return new Promise((resolve, reject) => {
    const browserWindow = window as any;
    if (browserWindow.google?.maps) return resolve(browserWindow.google.maps);
    const existing = document.querySelector(
      'script[data-geomatrix-google-maps="true"]',
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () =>
        resolve(browserWindow.google.maps),
      );
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.geomatrixGoogleMaps = "true";
    script.onload = () =>
      browserWindow.google?.maps
        ? resolve(browserWindow.google.maps)
        : reject(new Error("Google Maps API did not initialize"));
    script.onerror = () => reject(new Error("Unable to load Google Maps"));
    document.head.appendChild(script);
  });
}

function getRiskColor(level?: string, score?: number): string {
  const riskLevel = (level || "").toLowerCase();
  if (riskLevel === "critical" || (score ?? 0) >= 75) return "#dc2626";
  if (riskLevel === "high" || (score ?? 0) >= 50) return "#ea580c";
  if (riskLevel === "medium" || (score ?? 0) >= 25) return "#ca8a04";
  return "#16a34a";
}

function projectCoords(project: ApiProject, index: number): [number, number] {
  if (project.latitude && project.longitude && project.latitude !== 0)
    return [project.latitude, project.longitude];
  const coords = STATE_CENTER_COORDS[(project.state || "").toLowerCase()] || [
    20.5937, 78.9629,
  ];
  return [
    coords[0] + ((index % 5) - 2) * 0.12,
    coords[1] + ((Math.floor(index / 5) % 5) - 2) * 0.12,
  ];
}

function googlePlaceUrl(project: ApiProject) {
  const [lat, lng] = projectCoords(project, 0);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

function googleStreetViewUrl(project: ApiProject) {
  const [lat, lng] = projectCoords(project, 0);
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(`${lat},${lng}`)}`;
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const [dbProjects, setDbProjects] = useState<ApiProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const projects = await fetchProjects();
        if (active) setDbProjects(projects);
      } catch (error) {
        console.error("Failed to load map data:", error);
      } finally {
        if (active) setProjectsLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapContainerRef.current) {
      setMapFailed(true);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const googleMaps = await loadGoogleMaps(apiKey);
        if (cancelled || !mapContainerRef.current || mapRef.current) return;
        mapRef.current = new googleMaps.Map(mapContainerRef.current, {
          center: { lat: 22.8, lng: 79.5 },
          zoom: 5,
          mapTypeControl: true,
          mapTypeControlOptions: { mapTypeIds: ["roadmap", "satellite"] },
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
        });
        setMapReady(true);
      } catch (error) {
        console.error("Google Maps failed to load:", error);
        if (!cancelled) setMapFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap?.(null));
      mapRef.current = null;
    };
  }, []);

  const filteredProjects = useMemo(
    () =>
      dbProjects.filter((project) => {
        const query = searchQuery.toLowerCase();
        const matchSearch =
          !query ||
          project.name.toLowerCase().includes(query) ||
          project.project_code.toLowerCase().includes(query);
        const matchState =
          stateFilter === "All" || project.state === stateFilter;
        const matchRisk =
          riskFilter === "All" ||
          (project.risk_level || "Low").toLowerCase() ===
            riskFilter.toLowerCase();
        return matchSearch && matchState && matchRisk;
      }),
    [dbProjects, searchQuery, stateFilter, riskFilter],
  );

  useEffect(() => {
    const googleMaps = (window as any).google?.maps;
    if (!googleMaps || !mapRef.current) return;
    markersRef.current.forEach((marker) => marker.setMap?.(null));
    markersRef.current = filteredProjects.map((project, index) => {
      const [lat, lng] = projectCoords(project, index);
      const color = getRiskColor(project.risk_level, project.risk_score);
      const marker = new googleMaps.Marker({
        map: mapRef.current,
        position: { lat, lng },
        title: project.name,
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => setSelectedProject(project));
      return marker;
    });
  }, [filteredProjects, mapReady]);

  const uniqueStates = Array.from(
    new Set(dbProjects.map((project) => project.state).filter(Boolean)),
  );
  const criticalCount = filteredProjects.filter(
    (project) => (project.risk_level || "").toLowerCase() === "critical",
  ).length;
  const highCount = filteredProjects.filter(
    (project) => (project.risk_level || "").toLowerCase() === "high",
  ).length;
  const totalLand = filteredProjects.reduce(
    (total, project) => total + (project.land_required || 0),
    0,
  );

  return (
    <div className="page">
      <div className="maplayout">
        <section
          className="mapbox"
          style={{ position: "relative", overflow: "hidden" }}
        >
          <div
            ref={mapContainerRef}
            className="mapcanvas"
            style={{
              width: "100%",
              height: "100%",
              minHeight: 520,
              background: "#e8f1e8",
            }}
          />
          {mapFailed && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#f8fafc",
                color: "#0f172a",
                display: "flex",
                flexDirection: "column",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  background: "#e2e8f0",
                  borderBottom: "1px solid #cbd5e1",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={18} style={{ color: "#0284c7" }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    Google Maps configuration unavailable
                  </span>
                </div>
                <span
                  className="badge"
                  style={{ background: "#0284c7", color: "#fff", fontSize: 11 }}
                >
                  Add a valid API key
                </span>
              </div>
              <div style={{ padding: 24 }}>
                The Google Maps JavaScript API key is missing, invalid, or
                restricted for this local origin.
              </div>
            </div>
          )}
          {selectedProject && (
            <div
              style={{
                position: "absolute",
                left: 18,
                bottom: 18,
                width: 310,
                background: "#fff",
                border: "1px solid var(--line)",
                padding: 16,
                borderRadius: 8,
                boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="eyebrow">{selectedProject.project_code}</span>
                <button
                  onClick={() => setSelectedProject(null)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    fontWeight: "bold",
                  }}
                >
                  ✕
                </button>
              </div>
              <h3
                style={{ fontSize: 14, margin: "6px 0 4px", color: "#0f172a" }}
              >
                {selectedProject.name}
              </h3>
              <div className="sub" style={{ fontSize: 12, color: "#64748b" }}>
                {selectedProject.state}{" "}
                {selectedProject.district
                  ? `· ${selectedProject.district}`
                  : ""}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  margin: "12px 0",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: 6,
                }}
              >
                <span
                  className={`risk ${(selectedProject.risk_level || "low").toLowerCase()}`}
                >
                  {selectedProject.risk_level || "Low"} (
                  {selectedProject.risk_score ?? 0}/100)
                </span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {selectedProject.authority}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
                <div>
                  Land Required: <b>{selectedProject.land_required} ha</b>
                </div>
                <div>
                  Affected Families: <b>{selectedProject.affected_families}</b>
                </div>
                {selectedProject.primary_driver && (
                  <div style={{ color: "#dc2626", marginTop: 4 }}>
                    Driver: {selectedProject.primary_driver}
                  </div>
                )}
              </div>
              <Link
                className="btn primary"
                style={{ display: "block", textAlign: "center", width: "100%" }}
                href={`/projects/${selectedProject.id}`}
              >
                View Deep-Dive Risk Analysis -&gt;
              </Link>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <a
                  className="btn"
                  style={{ flex: 1, justifyContent: "center", fontSize: 11 }}
                  href={googleStreetViewUrl(selectedProject)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Street View
                </a>
                <a
                  className="btn"
                  style={{ flex: 1, justifyContent: "center", fontSize: 11 }}
                  href={googlePlaceUrl(selectedProject)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Place images
                </a>
              </div>
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 14,
              zIndex: 90,
              background: "#0b2547",
              color: "#ffffff",
              border: "1px solid #315b87",
              borderRadius: 5,
              padding: "7px 11px",
              fontSize: 11,
              fontWeight: 700,
              boxShadow: "0 3px 10px rgba(15, 23, 42, 0.28)",
            }}
          >
            Google GIS Map ({filteredProjects.length} Projects Active)
          </div>
        </section>
        <aside className="mapside">
          <div className="eyebrow">GIS Spatial Intelligence</div>
          <h2 style={{ fontSize: 20, margin: "5px 0" }}>
            Spatial Risk Overview
          </h2>
          <div
            className="search"
            style={{ maxWidth: "none", margin: "14px 0" }}
          >
            <Search size={14} />
            <input
              placeholder="Search map projects..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="mapmetric">
            <div className="mapmetric-total">
              <div className="muted">Total Projects</div>
              <b>{projectsLoaded ? filteredProjects.length : "Loading..."}</b>
            </div>
            <div className="mapmetric-critical">
              <div className="muted">Critical</div>
              <b style={{ color: "#dc2626" }}>
                {projectsLoaded ? criticalCount : "—"}
              </b>
            </div>
            <div className="mapmetric-high">
              <div className="muted">High-Risk</div>
              <b style={{ color: "#ea580c" }}>
                {projectsLoaded ? highCount : "—"}
              </b>
            </div>
            <div className="mapmetric-area">
              <div className="muted">Affected Area</div>
              <b>{projectsLoaded ? `${totalLand.toLocaleString()} ha` : "—"}</b>
            </div>
          </div>
          <div className="panel" style={{ padding: 12, marginTop: 14 }}>
            <div className="paneltitle">
              <SlidersHorizontal size={13} /> Map Filters
            </div>
            <div className="form" style={{ marginTop: 10 }}>
              <select
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value)}
              >
                <option value="All">All States</option>
                {uniqueStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
              >
                <option value="All">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="paneltitle">Risk Legend</div>
            <div className="legend" style={{ marginTop: 8 }}>
              <div className="legendrow">
                <span className="legenddot" style={{ background: "#dc2626" }} />{" "}
                Critical Risk (Score &gt;= 75)
              </div>
              <div className="legendrow">
                <span className="legenddot" style={{ background: "#ea580c" }} />{" "}
                High Risk (Score 50 - 74)
              </div>
              <div className="legendrow">
                <span className="legenddot" style={{ background: "#ca8a04" }} />{" "}
                Medium Risk (Score 25 - 49)
              </div>
              <div className="legendrow">
                <span className="legenddot" style={{ background: "#16a34a" }} />{" "}
                Low Risk (Score &lt; 25)
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
