"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { Activity } from "shared/types";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TYPE_HEX: Record<string, string> = {
  sightseeing: "#93CDFF",
  food: "#FFF3B0",
  transport: "#93CDFF",
  accommodation: "#FFD6C0",
  activity: "#93CDFF",
  other: "#e5e7eb",
};

function createColoredIcon(type: string) {
  const color = TYPE_HEX[type] ?? "#e5e7eb";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="#1A1A1A" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#1A1A1A"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
  });
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface GeocodedActivity extends Activity {
  lat: number;
  lng: number;
}

function FitBounds({ markers }: { markers: GeocodedActivity[] }) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, markers]);

  return null;
}

async function geocode(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "Tabi/1.0" },
    });
    const results: NominatimResult[] = await res.json();
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

export interface MapViewProps {
  activities: Activity[];
  tripDestination?: string;
}

export default function MapView({ activities }: MapViewProps) {
  const withLocation = useMemo(
    () => activities.filter((a) => !!a.location),
    [activities],
  );

  const [geocoded, setGeocoded] = useState<GeocodedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetGeocoded = useCallback((v: GeocodedActivity[]) => {
    if (mountedRef.current) setGeocoded(v);
  }, []);

  const safeSetLoading = useCallback((v: boolean) => {
    if (mountedRef.current) setLoading(v);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!withLocation.length) {
        safeSetLoading(false);
        return;
      }

      safeSetLoading(true);
      const results: GeocodedActivity[] = [];

      for (const act of withLocation) {
        if (cancelled) break;
        const cached = geoCache.get(act.location!);
        if (cached) {
          results.push({ ...act, ...cached });
          continue;
        }
        const coords = await geocode(act.location!);
        if (coords) {
          geoCache.set(act.location!, coords);
          results.push({ ...act, ...coords });
        }
      }

      if (!cancelled) {
        safeSetGeocoded(results);
        safeSetLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [withLocation, safeSetGeocoded, safeSetLoading]);

  if (!withLocation.length) {
    return (
      <div className="flex flex-col items-center justify-center h-105 border-2 border-[#1A1A1A] rounded-xl bg-[#f9f9f7]">
        <p className="font-display font-black text-xl uppercase text-[#9CA3AF]">
          No locations yet
        </p>
        <p className="text-sm text-[#6B7280] mt-1">
          Add a location to your activities to see them on the map.
        </p>
      </div>
    );
  }

  const defaultCenter: [number, number] = [20, 0];

  return (
    <div className="relative border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <p className="font-semibold text-sm text-[#6B7280] animate-pulse">
            Locating activities…
          </p>
        </div>
      )}
      <MapContainer
        center={defaultCenter}
        zoom={2}
        scrollWheelZoom
        style={{ height: 420, width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          keepBuffer={4}
        />
        {geocoded.length > 0 && <FitBounds markers={geocoded} />}
        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
          {geocoded.map((act) => (
            <Marker
              key={act._id}
              position={[act.lat, act.lng]}
              icon={createColoredIcon(act.type)}
            >
              <Popup>
                <div className="min-w-40">
                  <p className="font-bold text-sm leading-snug">{act.title}</p>
                  <p className="text-xs text-[#6B7280] capitalize mt-0.5">
                    {act.type}
                  </p>
                  {act.location && (
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {act.location}
                    </p>
                  )}
                  {act.startTime && (
                    <p className="text-xs text-[#9CA3AF]">{act.startTime}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

const geoCache = new Map<string, { lat: number; lng: number }>();
