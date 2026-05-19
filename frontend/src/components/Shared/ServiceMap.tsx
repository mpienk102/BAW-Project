import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ServiceListing } from '../../context/MarketplaceContext';

// Fix default Leaflet icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Geocoding cache ───────────────────────────────────────────────────────────

const geoCache = new Map<string, [number, number]>();

// Known Polish district/city coords to avoid API calls for common demo data
const KNOWN_LOCATIONS: Record<string, [number, number]> = {
    'warszawa mokotow': [52.1948, 21.0191],
    'warszawa mokotów': [52.1948, 21.0191],
    'warszawa wola':    [52.2330, 20.9768],
    'warszawa':         [52.2297, 21.0122],
    'krakow':           [50.0647, 19.9450],
    'kraków':           [50.0647, 19.9450],
    'wroclaw':          [51.1079, 17.0385],
    'wrocław':          [51.1079, 17.0385],
    'poznan':           [52.4064, 16.9252],
    'poznań':           [52.4064, 16.9252],
    'gdansk':           [54.3520, 18.6466],
    'gdańsk':           [54.3520, 18.6466],
    'lodz':             [51.7592, 19.4560],
    'łódź':             [51.7592, 19.4560],
    'katowice':         [50.2649, 19.0238],
};

async function geocode(label: string): Promise<[number, number] | null> {
    const key = label.toLowerCase().trim();
    if (geoCache.has(key)) return geoCache.get(key)!;

    // Check known locations first (no API call)
    for (const [known, coords] of Object.entries(KNOWN_LOCATIONS)) {
        if (key.includes(known)) {
            geoCache.set(key, coords);
            return coords;
        }
    }

    // Fall back to Nominatim
    try {
        const q = encodeURIComponent(`${label}, Polska`);
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'pl' } }
        );
        const data = await res.json() as Array<{ lat: string; lon: string }>;
        if (data.length > 0) {
            const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            geoCache.set(key, coords);
            return coords;
        }
    } catch {
        // Network error — ignore
    }
    return null;
}

// ── Auto-fit bounds ────────────────────────────────────────────────────────────

const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points.length === 0) return;
        if (points.length === 1) {
            map.setView(points[0], 11);
            return;
        }
        const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [points, map]);
    return null;
};

// ── Resolved service ──────────────────────────────────────────────────────────

interface ResolvedPin {
    service: ServiceListing;
    coords: [number, number];
}

// ── Accent colour from CSS var (fallback to orange) ───────────────────────────
const ACCENT = '#d97706';

// ── Main component ────────────────────────────────────────────────────────────

interface ServiceMapProps {
    services: ServiceListing[];
}

export const ServiceMap: React.FC<ServiceMapProps> = ({
    services,
}) => {
    const [pins, setPins] = useState<ResolvedPin[]>([]);
    const [loading, setLoading] = useState(true);
    const resolvedRef = useRef(false);

    useEffect(() => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;

        const resolve = async () => {
            setLoading(true);
            const results: ResolvedPin[] = [];

            for (const svc of services.slice(0, 8)) {
                const coords = await geocode(svc.locationLabel);
                if (coords) results.push({ service: svc, coords });
            }

            setPins(results);
            setLoading(false);
        };

        void resolve();
    }, [services]);

    // Re-resolve when services list changes (e.g. after filter)
    useEffect(() => {
        resolvedRef.current = false;
    }, [services.length]);

    const points = pins.map(p => p.coords);

    // Default center: Warszawa
    const defaultCenter: [number, number] = KNOWN_LOCATIONS['warszawa'];

    return (
        <div className="relative h-full w-full min-h-[420px] overflow-hidden rounded-[2rem]">
            {loading && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-[2rem] bg-white/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-line)] border-t-amber-600" />
                        <p className="text-xs font-semibold text-[var(--color-muted)]">Ładowanie mapy…</p>
                    </div>
                </div>
            )}

            <MapContainer
                center={defaultCenter}
                zoom={11}
                className="h-full w-full min-h-[420px]"
                scrollWheelZoom={false}
                style={{ borderRadius: '2rem' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitBounds points={points} />

                {pins.map(({ service, coords }) => (
                    <React.Fragment key={service.id}>
                        {/* Range circle */}
                        <Circle
                            center={coords}
                            radius={service.radiusKm * 1000}
                            pathOptions={{
                                color: ACCENT,
                                fillColor: ACCENT,
                                fillOpacity: 0.08,
                                weight: 1.5,
                                dashArray: '6 4',
                            }}
                        />

                        {/* Custom pin marker */}
                        <Circle
                            center={coords}
                            radius={300}
                            pathOptions={{
                                color: ACCENT,
                                fillColor: ACCENT,
                                fillOpacity: 0.85,
                                weight: 2,
                            }}
                        >
                            <Popup>
                                <div className="min-w-[180px]">
                                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                        {service.category}
                                    </p>
                                    <p className="mt-1 font-bold text-gray-900 leading-tight">
                                        {service.title}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {service.provider.company}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-lg font-black text-amber-600">
                                            {service.price} zł
                                            <span className="ml-1 text-xs font-semibold text-gray-400">
                                                {service.priceType === 'hourly' ? '/h' : 'ryczałt'}
                                            </span>
                                        </span>
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                            {service.radiusKm} km
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">{service.locationLabel}</p>
                                </div>
                            </Popup>
                        </Circle>
                    </React.Fragment>
                ))}
            </MapContainer>
        </div>
    );
};
