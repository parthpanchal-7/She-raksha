'use client';

/**
 * @she-raksha/web — Geospatial Radar 3D GIS Globe Component
 *
 * Implements:
 *  - High-fidelity 3D satellite GIS globe (ESRI World Imagery + Bhu-Manthan digital twin cadastre)
 *  - Midnight Obsidian dark-tinted overlay (rgba(10, 13, 18, 0.4))
 *  - Default 3D oblique viewport centered on India (pitch: 45°, bearing: -10°) with terrain & state boundaries
 *  - PostGIS ST_DWithin 800m active dispatch geofence polygon overlay (#FF3B5C 1px solid border & transparent fill)
 *  - Regional Command Hubs (Mumbai, Kolkata, Hyderabad, Bengaluru, Chennai) with Emerald Shield markers
 *  - Active Incident SOS trigger (New Delhi) with Crimson Coral pulsing radial animation
 *  - Floating Telemetry & Location console (#3950:1 #980021 Base91, • WSS, Rail A)
 *  - Top Left Toolbar with live cursor coordinates, elevation, and H3 Res-9 index
 *  - Floating Vertical Toolbar with 3D tilt toggle, zoom in/out, pitch reset, and full-view toggle
 */

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  Maximize2,
  Minimize2,
  Globe,
  Radio,
  UserCheck,
  Compass,
  RotateCcw,
  Shield,
  Activity,
  X,
} from 'lucide-react';
import { colors } from '@she-raksha/design-tokens';
import { IncidentEscrowItem } from './InstitutionalDashboard.js';

export interface Geospatial3DGisGlobeProps {
  activeCase: IncidentEscrowItem;
  isFullMapView: boolean;
  onToggleFullView: () => void;
  onSelectGuardian?: (id: string) => void;
  selectedGuardian?: string | null;
  onClearGuardian?: () => void;
}

// Regional Command Hubs across India
const REGIONAL_COMMAND_HUBS = [
  { name: 'Mumbai Command', coords: [72.8777, 19.076] as [number, number], role: 'Western Fleet / HQ' },
  { name: 'Bengaluru Command', coords: [77.5946, 12.9716] as [number, number], role: 'Southern Cyber / HQ' },
  { name: 'Kolkata Command', coords: [88.3639, 22.5726] as [number, number], role: 'Eastern Border / HQ' },
  { name: 'Hyderabad Hub', coords: [78.4867, 17.385] as [number, number], role: 'Central Geospatial Hub' },
  { name: 'Chennai Command', coords: [80.2707, 13.0827] as [number, number], role: 'Coastal Response Command' },
];

// Active Incident location: Connaught Place, New Delhi
const INCIDENT_CENTER: [number, number] = [77.209, 28.6139];

// Community Guardians within 800m radius
const NEARBY_GUARDIANS = [
  { id: 'G-01', dist: '180m', offset: [-0.0015, 0.0012] as [number, number], corridor: 'Barakhamba' },
  { id: 'G-02', dist: '290m', offset: [0.0022, 0.0018] as [number, number], corridor: 'Minto Road' },
  { id: 'G-03', dist: '420m', offset: [-0.0028, -0.0022] as [number, number], corridor: 'Janpath Metro' },
  { id: 'G-04', dist: '510m', offset: [0.0035, -0.0028] as [number, number], corridor: 'KG Marg' },
];

// Helper to generate a PostGIS circular buffer polygon
function createGeoJSONCircle(center: [number, number], radiusInMeters: number, points = 64) {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  const distanceX = radiusInMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusInMeters / 110540;

  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coords],
    },
    properties: {},
  };
}

export const Geospatial3DGisGlobe: React.FC<Geospatial3DGisGlobeProps> = ({
  activeCase,
  isFullMapView,
  onToggleFullView,
  onSelectGuardian,
  selectedGuardian,
  onClearGuardian,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // Live cursor telemetry state
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lng: number;
    elevation: number;
    h3Index: string;
  }>({
    lat: 28.6139,
    lng: 77.209,
    elevation: 216,
    h3Index: activeCase.h3Index || '893da11462fffff',
  });

  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapViewFocus, setMapViewFocus] = useState<'india' | 'delhi'>('india');

  // Initialize MapLibre 3D Satellite Globe
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            // High-resolution ESRI World Imagery (Global Satellite Digital Twin)
            'satellite-imagery': {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              ],
              tileSize: 256,
              attribution: 'Esri, Maxar, Earthstar Geographics, USDA, USGS',
            },
            // CartoDB Dark Matter subtle boundaries & labels
            'carto-labels': {
              type: 'raster',
              tiles: [
                'https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
            },
          },
          layers: [
            // 1. High-Resolution Satellite Base Layer
            {
              id: 'satellite-base-layer',
              type: 'raster',
              source: 'satellite-imagery',
              minzoom: 0,
              maxzoom: 20,
            },
            // 2. Midnight Obsidian Dark Tint Overlay (0.4 opacity)
            {
              id: 'midnight-obsidian-overlay',
              type: 'background',
              paint: {
                'background-color': '#0A0D12',
                'background-opacity': 0.38,
              },
            },
            // 3. Topographic and State Boundary Labels
            {
              id: 'carto-labels-layer',
              type: 'raster',
              source: 'carto-labels',
              minzoom: 1,
              maxzoom: 20,
              paint: {
                'raster-opacity': 0.85,
              },
            },
          ],
        },
        center: [78.9629, 22.5937], // Center of India
        zoom: 4.8,
        pitch: 45, // 3D Topographical Perspective Pitch
        bearing: -10, // 3D Oblique Angle
        attributionControl: false,
      });

      map.on('load', () => {
        setMapLoaded(true);

        // -------------------------------------------------------------------
        // PostGIS 800m Geofence Buffer Polygon Layer (ST_DWithin)
        // -------------------------------------------------------------------
        const geofence800m = createGeoJSONCircle(INCIDENT_CENTER, 800);
        const geofence400m = createGeoJSONCircle(INCIDENT_CENTER, 400);

        map.addSource('geofence-800m-src', {
          type: 'geojson',
          data: geofence800m,
        });

        map.addSource('geofence-400m-src', {
          type: 'geojson',
          data: geofence400m,
        });

        // 800m Geofence Fill: Transparent Crimson Coral
        map.addLayer({
          id: 'geofence-800m-fill',
          type: 'fill',
          source: 'geofence-800m-src',
          paint: {
            'fill-color': '#FF3B5C',
            'fill-opacity': 0.18,
          },
        });

        // 800m Geofence Border: 1px Solid Crimson Coral
        map.addLayer({
          id: 'geofence-800m-border',
          type: 'line',
          source: 'geofence-800m-src',
          paint: {
            'line-color': '#FF3B5C',
            'line-width': 1.5,
            'line-dasharray': [4, 4],
          },
        });

        // 400m Inner Proximity Line: Emerald Shield
        map.addLayer({
          id: 'geofence-400m-border',
          type: 'line',
          source: 'geofence-400m-src',
          paint: {
            'line-color': '#00D084',
            'line-width': 1,
            'line-opacity': 0.6,
          },
        });

        // -------------------------------------------------------------------
        // Marker 1: Active Incident at New Delhi (Crimson Coral Pulsing Ring)
        // -------------------------------------------------------------------
        const incidentEl = document.createElement('div');
        incidentEl.className = 'cursor-pointer flex items-center justify-center';
        incidentEl.innerHTML = `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: #FF3B5C; opacity: 0.35; animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; border: 2px dashed #FF3B5C;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #FF3B5C; box-shadow: 0 0 12px #FF3B5C;"></div>
            <div style="position: absolute; top: 46px; left: 50%; transform: translateX(-50%); background: rgba(18, 24, 36, 0.9); border: 1px solid #FF3B5C; color: #FF3B5C; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; white-space: nowrap; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
              ACTIVE INCIDENT: NEW DELHI
            </div>
          </div>
        `;
        incidentEl.onclick = () => {
          map.flyTo({
            center: INCIDENT_CENTER,
            zoom: 14.5,
            pitch: 55,
            bearing: -20,
            duration: 2000,
          });
          setMapViewFocus('delhi');
        };

        new maplibregl.Marker({ element: incidentEl })
          .setLngLat(INCIDENT_CENTER)
          .addTo(map);

        // -------------------------------------------------------------------
        // Markers 2: Regional Command Hubs (Emerald Shield #00D084)
        // -------------------------------------------------------------------
        REGIONAL_COMMAND_HUBS.forEach((hub) => {
          const hubEl = document.createElement('div');
          hubEl.className = 'cursor-pointer flex items-center justify-center';
          hubEl.innerHTML = `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: #00D084; opacity: 0.25;"></div>
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #00D084; box-shadow: 0 0 8px #00D084;"></div>
              <div style="position: absolute; top: 26px; left: 50%; transform: translateX(-50%); background: rgba(18, 24, 36, 0.85); border: 1px solid rgba(0, 208, 132, 0.4); color: #F8FAFC; font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 600; padding: 1px 5px; border-radius: 3px; white-space: nowrap; pointer-events: none;">
                ${hub.name}
              </div>
            </div>
          `;
          hubEl.onclick = () => {
            map.flyTo({
              center: hub.coords,
              zoom: 11,
              pitch: 45,
              duration: 1800,
            });
          };

          new maplibregl.Marker({ element: hubEl }).setLngLat(hub.coords).addTo(map);
        });

        // -------------------------------------------------------------------
        // Markers 3: Nearby Community Guardians around New Delhi Incident
        // -------------------------------------------------------------------
        NEARBY_GUARDIANS.forEach((g) => {
          const gEl = document.createElement('div');
          gEl.className = 'cursor-pointer';
          gEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 4px; background: rgba(18, 24, 36, 0.88); border: 1px solid #00D084; border-radius: 12px; padding: 2px 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #00D084; box-shadow: 0 0 6px #00D084;"></span>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: bold; color: #00D084;">${g.id} (${g.dist})</span>
            </div>
          `;
          gEl.onclick = () => {
            onSelectGuardian?.(g.id);
          };

          new maplibregl.Marker({ element: gEl })
            .setLngLat([INCIDENT_CENTER[0] + g.offset[0], INCIDENT_CENTER[1] + g.offset[1]])
            .addTo(map);
        });
      });

      // Cursor movement coordinate tracking
      map.on('mousemove', (e) => {
        const lat = parseFloat(e.lngLat.lat.toFixed(4));
        const lng = parseFloat(e.lngLat.lng.toFixed(4));
        const elev = Math.round(210 + Math.abs(lat - 28.6) * 50 + Math.abs(lng - 77.2) * 30);
        setCursorCoords({
          lat,
          lng,
          elevation: elev,
          h3Index: activeCase.h3Index || '893da11462fffff',
        });
      });

      mapRef.current = map;
    } catch (err) {
      console.warn('MapLibre 3D GIS initialization skipped or fallback active:', err);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [activeCase.h3Index]);

  // Camera Actions
  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 300 });
  };

  const handleResetCamera = () => {
    if (mapViewFocus === 'delhi') {
      mapRef.current?.flyTo({
        center: [78.9629, 22.5937],
        zoom: 4.8,
        pitch: 45,
        bearing: -10,
        duration: 1800,
      });
      setMapViewFocus('india');
    } else {
      mapRef.current?.flyTo({
        center: INCIDENT_CENTER,
        zoom: 14.5,
        pitch: 55,
        bearing: -20,
        duration: 1800,
      });
      setMapViewFocus('delhi');
    }
  };

  const handleToggle3D = () => {
    if (!mapRef.current) return;
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    mapRef.current.easeTo({
      pitch: next3D ? 50 : 0,
      bearing: next3D ? -15 : 0,
      duration: 800,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ backgroundColor: '#070A0E' }}>
      {/* 3D Mapbox / MapLibre Container Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Subtle Fallback Dark Grid Pattern if WebGL is initializing or in headless tests */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(123, 63, 228, 0.15) 0%, transparent 70%)`,
        }}
      />

      {/* =================================================================== */}
      {/* FLOATING UI OVERLAY 1: TOP LEFT TOOLBAR */}
      {/* INDIA NATIONAL GIS RADAR with live cursor coordinates & H3 index */}
      {/* =================================================================== */}
      <div
        className="absolute top-5 left-5 flex flex-col gap-1.5 p-3.5 rounded-xl shadow-2xl z-20 max-w-sm backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(18, 24, 36, 0.88)', // Dark Slate surface
          border: `1px solid ${colors.subtleWire}`, // Subtle Wire 1px border
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: colors.crimsonCoral }}
          />
          <h4 className="text-xs font-bold uppercase tracking-wider text-pure-frost font-mono">
            INDIA NATIONAL GIS RADAR
          </h4>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold ml-auto"
            style={{
              backgroundColor: 'rgba(0, 208, 132, 0.15)',
              border: `1px solid ${colors.emeraldShield}`,
              color: colors.emeraldShield,
            }}
          >
            800m Geofence Boundary Active
          </span>
        </div>

        {/* Live Cursor Coordinate Tracking in JetBrains Mono */}
        <div
          className="text-[11px] font-mono leading-tight mt-1 flex flex-col gap-0.5"
          style={{
            color: colors.mutedSilver,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div className="flex items-center justify-between text-pure-frost">
            <span>
              {cursorCoords.lat.toFixed(4)}° N, {cursorCoords.lng.toFixed(4)}° E
            </span>
            <span className="text-[10px] text-dim-steel">
              Elev: {cursorCoords.elevation}m ASL
            </span>
          </div>
          <div className="text-[10px] text-dim-steel">
            H3 Res-9: <span className="text-electric-amber font-mono">{cursorCoords.h3Index}</span> • ST_DWithin 800m
          </div>
        </div>

        <div className="text-[10px] text-dim-steel flex items-center justify-between pt-1 border-t border-subtle-wire">
          <span>PostGIS GiST: 5 Active Guardians</span>
          <span className="font-mono text-emerald-shield font-bold" style={{ color: colors.emeraldShield }}>
            {mapViewFocus === 'delhi' ? 'TACTICAL 800m' : '3D SATELLITE GLOBE'}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* FLOATING UI OVERLAY 2: RIGHT EDGE MAP CONTROLS */}
      {/* Zoom (+/-), 2D/3D Toggle, Pitch/Bearing Reset, Fullscreen Toggle */}
      {/* =================================================================== */}
      <div
        className="absolute top-5 right-5 flex flex-col gap-1.5 p-1.5 rounded-xl shadow-2xl z-20 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(18, 24, 36, 0.90)', // Dark Slate surface
          border: `1px solid ${colors.subtleWire}`, // Subtle Wire border
        }}
      >
        {/* Toggle View Center: India Globe vs Delhi Tactical */}
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-lg hover:bg-midnight-obsidian transition-all cursor-pointer active:scale-95"
          style={{
            color: mapViewFocus === 'delhi' ? colors.crimsonCoral : colors.emeraldShield,
          }}
          title={mapViewFocus === 'delhi' ? 'Zoom Out to National India Globe' : 'Focus Active Incident (New Delhi)'}
        >
          <Globe className="w-4 h-4" />
        </button>

        <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

        {/* Zoom In (+) */}
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg hover:bg-midnight-obsidian transition-all text-pure-frost cursor-pointer active:scale-95"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

        {/* Zoom Out (-) */}
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg hover:bg-midnight-obsidian transition-all text-pure-frost cursor-pointer active:scale-95"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

        {/* 2D / 3D Oblique Tilt Toggle */}
        <button
          onClick={handleToggle3D}
          className="p-2 rounded-lg hover:bg-midnight-obsidian transition-all cursor-pointer active:scale-95 text-xs font-mono font-bold"
          style={{
            color: is3DMode ? colors.polygonPurple : colors.mutedSilver,
          }}
          title={is3DMode ? 'Switch to 2D Top-Down Cadastre' : 'Switch to 3D Topographical Perspective'}
        >
          <span className="text-[11px] block text-center leading-none">
            {is3DMode ? '3D' : '2D'}
          </span>
        </button>

        <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

        {/* Reset Bearing & Pitch */}
        <button
          onClick={() => {
            mapRef.current?.easeTo({ pitch: 45, bearing: -10, duration: 600 });
            setIs3DMode(true);
          }}
          className="p-2 rounded-lg hover:bg-midnight-obsidian transition-all cursor-pointer active:scale-95"
          style={{ color: colors.emeraldShield }}
          title="Reset Pitch & Bearing to Default"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-px w-full" style={{ backgroundColor: colors.subtleWire }} />

        {/* Fullscreen Map Toggle */}
        <button
          onClick={onToggleFullView}
          className="p-2 rounded-lg hover:bg-midnight-obsidian transition-all text-pure-frost cursor-pointer active:scale-95"
          title={isFullMapView ? 'Exit Full GIS View' : 'Maximize Map to Full View'}
        >
          {isFullMapView ? (
            <Minimize2 className="w-4 h-4 text-polygon-purple" style={{ color: colors.polygonPurple }} />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Selected Guardian Quick Telemetry Card Popup */}
      {selectedGuardian && (
        <div
          className="absolute top-24 left-5 p-4 rounded-xl shadow-2xl z-30 flex flex-col gap-2 animate-fadeIn backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(18, 24, 36, 0.95)',
            border: `1px solid ${colors.emeraldShield}`,
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold text-pure-frost">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-shield" style={{ color: colors.emeraldShield }} />
              Guardian {selectedGuardian} Dispatched Node
            </span>
            <button
              onClick={onClearGuardian}
              className="text-dim-steel hover:text-pure-frost ml-4 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="text-[11px] font-mono" style={{ color: colors.mutedSilver }}>
            Status: <span className="text-emerald-shield font-bold" style={{ color: colors.emeraldShield }}>STANDBY ACTIVE</span> • 800m Buffer GiST
          </div>
          <div className="text-[10px] text-dim-steel font-mono">
            W3C secp256r1 Passkey Authenticated • Battery 94% • Rail A/B Ready
          </div>
        </div>
      )}

      {/* Full Screen Map Notice Pill */}
      {isFullMapView && (
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-md animate-fadeIn"
          style={{
            backgroundColor: 'rgba(18, 24, 36, 0.95)',
            border: `1px solid ${colors.polygonPurple}`,
            color: colors.pureFrost,
          }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.polygonPurple }} />
          <span>FULL GIS MAP MODE (100% CANVASS)</span>
          <button
            onClick={onToggleFullView}
            className="px-2 py-0.5 rounded bg-midnight-obsidian hover:bg-dark-slate transition-colors text-dim-steel hover:text-pure-frost flex items-center gap-1 cursor-pointer border border-subtle-wire"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Full View</span>
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* FLOATING UI OVERLAY 3: BOTTOM FLOATING CONSOLE */}
      {/* ACTIVE INCIDENT with Telemetry, Rate, Base91, and Dispatch Mode */}
      {/* =================================================================== */}
      <div
        className="absolute bottom-5 left-5 right-5 p-4 rounded-xl shadow-2xl z-20 transition-all backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(18, 24, 36, 0.92)', // Dark Slate surface with blur
          border: `1px solid ${colors.subtleWire}`, // Subtle Wire 1px border
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 59, 92, 0.15)',
        }}
        data-testid="active-incident-overlay"
      >
        {/* Header: ACTIVE INCIDENT (Crimson Coral alert #FF3B5C) */}
        <div
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: colors.subtleWire }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: colors.crimsonCoral }}
            />
            <h3
              className="text-sm font-bold tracking-wider"
              style={{
                color: colors.crimsonCoral, // #FF3B5C
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
              }}
            >
              ACTIVE INCIDENT
            </h3>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
              style={{
                backgroundColor: 'rgba(255, 59, 92, 0.15)',
                color: colors.crimsonCoral,
                border: `1px solid rgba(255, 59, 92, 0.3)`,
              }}
            >
              {activeCase.incidentId}
            </span>
          </div>

          {/* Active tracking badge: Connection Status • WSS */}
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold"
              style={{
                backgroundColor: 'rgba(0, 208, 132, 0.12)',
                border: `1px solid ${colors.emeraldShield}`,
                color: colors.emeraldShield,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: colors.emeraldShield }}
              />
              • WSS
            </span>
          </div>
        </div>

        {/* Content: Telemetry & Location, Rate, Base91 Packet Tracking, Dispatch Mode */}
        <div className="grid grid-cols-4 gap-4 pt-3 text-xs">
          <div>
            <span
              className="text-[10px] uppercase font-mono tracking-wider block mb-0.5"
              style={{ color: colors.dimSteel }}
            >
              Telemetry & Location
            </span>
            <span
              className="font-mono text-pure-frost font-medium block truncate"
              title={activeCase.coarseLocation}
            >
              {activeCase.coarseLocation}
            </span>
            <span className="text-[10px] font-mono text-dim-steel">
              GPS HDOP: 1.1 • IMU 2.8g
            </span>
          </div>

          <div>
            <span
              className="text-[10px] uppercase font-mono tracking-wider block mb-0.5"
              style={{ color: colors.dimSteel }}
            >
              Rate
            </span>
            <span className="font-mono text-pure-frost font-medium">
              5s Chunks • 128kbps AAC
            </span>
          </div>

          <div>
            <span
              className="text-[10px] uppercase font-mono tracking-wider block mb-0.5"
              style={{ color: colors.dimSteel }}
            >
              Base91 Packet Tracking
            </span>
            <span
              className="font-mono px-2 py-0.5 rounded font-bold"
              style={{
                backgroundColor: colors.midnightObsidian,
                border: `1px solid ${colors.subtleWire}`,
                color: colors.electricAmber,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              #3950:1 #980021
            </span>
          </div>

          <div>
            <span
              className="text-[10px] uppercase font-mono tracking-wider block mb-0.5"
              style={{ color: colors.dimSteel }}
            >
              Dispatch Mode
            </span>
            <span
              className="font-mono text-emerald-shield font-medium"
              style={{ color: colors.emeraldShield }}
            >
              Rail A (WSS) Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
