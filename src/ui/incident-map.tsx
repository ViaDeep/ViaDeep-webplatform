import 'leaflet/dist/leaflet.css';

import { useEffect, type ReactNode } from 'react';
import { AttributionControl, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';

import { reportCode, TYPE_LABELS, type IncidentSummary } from '@/domain/incident';

import { LIMA_CENTER, markerColor } from './map-style';

export type BaseLayer = 'streets' | 'satellite';

const TILES: Record<BaseLayer, { url: string; attribution: string }> = {
  streets: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imágenes &copy; Esri',
  },
};

function FitToIncidents({ incidents, focusId }: { incidents: IncidentSummary[]; focusId?: string | null }) {
  const map = useMap();
  useEffect(() => {
    const focus = focusId ? incidents.find((incident) => incident.id === focusId) : undefined;
    if (focus) {
      map.setView([focus.latitude, focus.longitude], 16);
      return;
    }
    if (incidents.length === 0) return;
    const lats = incidents.map((incident) => incident.latitude);
    const lngs = incidents.map((incident) => incident.longitude);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40], maxZoom: 15 },
    );
  }, [map, incidents, focusId]);
  return null;
}

type IncidentMapProps = {
  incidents: IncidentSummary[];
  layer?: BaseLayer;
  selectedId?: string | null;
  focusId?: string | null;
  onSelect?: (incident: IncidentSummary) => void;
  interactive?: boolean;
  children?: ReactNode;
};

export function IncidentMap({ incidents, layer = 'streets', selectedId, focusId, onSelect, interactive = true, children }: IncidentMapProps) {
  const tiles = TILES[layer];
  return (
    <MapContainer
      center={LIMA_CENTER}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      attributionControl={false}
    >
      <AttributionControl prefix={false} position="bottomright" />
      <TileLayer key={layer} url={tiles.url} attribution={tiles.attribution} />
      <FitToIncidents incidents={incidents} focusId={focusId} />
      {incidents.map((incident) => {
        const selected = incident.id === selectedId;
        const color = markerColor(incident);
        return (
          <CircleMarker
            key={incident.id}
            center={[incident.latitude, incident.longitude]}
            radius={selected ? 10 : 7}
            pathOptions={{ color: selected ? '#0f2042' : '#ffffff', weight: selected ? 3 : 2, fillColor: color, fillOpacity: 0.95 }}
            eventHandlers={onSelect ? { click: () => onSelect(incident) } : undefined}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="mono" style={{ fontSize: 11 }}>
                {reportCode(incident.id, incident.createdAt)}
              </span>
              <br />
              {TYPE_LABELS[incident.type]} · {incident.district ?? 'Sin distrito'}
            </Tooltip>
          </CircleMarker>
        );
      })}
      {children}
    </MapContainer>
  );
}
