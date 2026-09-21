'use client';

import { useEffect, useRef, useState } from 'react';
import type { ApiProject } from '../lib/apiClient';

type GoogleMaps = any;
type GoogleMap = any;
type GoogleMarker = any;

const RISK_HEX: Record<string, string> = { Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#16a34a' };
const riskClass: Record<string, string> = { Critical: 'risk-critical', High: 'risk-high', Medium: 'risk-medium', Low: 'risk-low' };

function loadGoogleMaps(apiKey: string): Promise<GoogleMaps> {
  return new Promise((resolve, reject) => {
    const browserWindow = window as any;
    if (browserWindow.google?.maps) return resolve(browserWindow.google.maps);
    const existing = document.querySelector('script[data-geomatrix-google-maps="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(browserWindow.google.maps));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.geomatrixGoogleMaps = 'true';
    script.onload = () => browserWindow.google?.maps ? resolve(browserWindow.google.maps) : reject(new Error('Google Maps API did not initialize'));
    script.onerror = () => reject(new Error('Unable to load Google Maps'));
    document.head.appendChild(script);
  });
}

export default function DashboardRiskMap({ projects }: { projects: ApiProject[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) {
      setFailed(true);
      return () => { cancelled = true; };
    }
    (async () => {
      try {
        const googleMaps = await loadGoogleMaps(apiKey);
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapRef.current = new googleMaps.Map(containerRef.current, {
          center: { lat: 22.8, lng: 79.5 },
          zoom: 4,
          disableDefaultUI: true,
          gestureHandling: 'none',
          clickableIcons: false,
        });
        setReady(true);
      } catch (error) {
        console.error('Dashboard Google Map failed:', error);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap?.(null));
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const googleMaps = (window as any).google?.maps;
    if (!googleMaps || !mapRef.current) return;
    markersRef.current.forEach((marker) => marker.setMap?.(null));
    markersRef.current = projects
      .filter((project) => project.latitude != null && project.longitude != null && project.latitude !== 0)
      .map((project) => {
        const color = RISK_HEX[project.risk_level ?? ''] ?? RISK_HEX.Low;
        return new googleMaps.Marker({
          map: mapRef.current,
          position: { lat: project.latitude, lng: project.longitude },
          title: `${project.name} · ${project.risk_level ?? 'Unclassified'}`,
          icon: { path: googleMaps.SymbolPath.CIRCLE, scale: 7, fillColor: color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
        });
      });
  }, [projects, ready]);

  const plotted = projects.filter((project) => project.latitude != null && project.longitude != null).length;

  return (
    <div className="command-map-board" aria-label="Project locations map" style={{ position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, background: '#e8f1e8' }} />
      {failed && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#e8f1e8', color: '#334155', fontSize: 12 }}>Google map unavailable</div>}
      <div className="command-map-legend">{['Low', 'Medium', 'High', 'Critical'].map((level) => <span key={level}><i className={riskClass[level]} />{level} risk</span>)}</div>
      <div className="command-map-count"><strong>{plotted || 'No verified data available'}</strong><span>Projects mapped</span></div>
    </div>
  );
}
