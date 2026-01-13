'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
import { Animal, Poi } from '@/types/zoo';

type DefaultIconPrototype = typeof L.Icon.Default.prototype & { _getIconUrl?: () => string };

// Fix Leaflet icons for Next.js environments
delete (L.Icon.Default.prototype as DefaultIconPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const poiColors: Record<Poi['category'], string> = {
  animals: '#b45309',
  plants: '#15803d',
  practical: '#1d4ed8',
  other: '#6b7280',
};

const poiLabels: Record<Poi['category'], string> = {
  animals: 'Animaux',
  plants: 'Plantes & jardins',
  practical: 'Services',
  other: 'Autres',
};

const poiGradients: Record<Poi['category'], string> = {
  animals: 'linear-gradient(135deg, #b45309, #f97316)',
  plants: 'linear-gradient(135deg, #15803d, #4ade80)',
  practical: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
  other: 'linear-gradient(135deg, #6b7280, #cbd5f5)',
};

const poiGlyphs: Record<Poi['category'], string> = {
  animals: '🐾',
  plants: '🌿',
  practical: '☕',
  other: '⭐️',
};

const poiCategories: Poi['category'][] = ['animals', 'plants', 'practical', 'other'];

const KM0_LIVE_HUB_ID = 'km0-live-hub';

const createPoiIcon = (category: Poi['category']) =>
  L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;transform:translateY(-4px);">
        <span style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
          color:#fff;
          width:32px;
          height:32px;
          border-radius:9999px 9999px 9999px 0;
          border:2px solid rgba(255,255,255,0.9);
          background:${poiGradients[category]};
          box-shadow:0 6px 12px rgba(0,0,0,0.35);
          transform:rotate(-15deg);
        ">${poiGlyphs[category]}</span>
        <span style="
          width:6px;
          height:10px;
          border-radius:9999px;
          background:${poiColors[category]};
          opacity:0.9;
        "></span>
      </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 34],
  });

const FALLBACK_CENTER: [number, number] = [47.734537, 7.350343];

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 10000,
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
      border: 3px solid #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 18px rgba(30, 64, 175, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        font-size: 18px;
        line-height: 1;
        color: #ffffff;
      ">🧍</span>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 26],
});

const animalCategoryMeta: Record<Animal['category'], { gradient: string; border: string; label: string }> = {
  mammal: { gradient: 'linear-gradient(135deg,#fcd9b6,#f5a25c)', border: '#b45309', label: 'MAM' },
  bird: { gradient: 'linear-gradient(135deg,#fde1f2,#f472b6)', border: '#be185d', label: 'OIS' },
  reptile: { gradient: 'linear-gradient(135deg,#e0f2fe,#38bdf8)', border: '#0369a1', label: 'REP' },
  amphibian: { gradient: 'linear-gradient(135deg,#d1fae5,#34d399)', border: '#047857', label: 'AMP' },
};



const GEO_UNSUPPORTED_MESSAGE = "La géolocalisation n'est pas supportée par ce navigateur.";

const createEnclosureBadgeIcon = (animal: Animal) =>
  L.divIcon({
    className: 'enclosure-badge-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;transform:translateY(-10px);">
        <div style="background:linear-gradient(135deg,#ffb347,#ffcc33);color:#512002;font-weight:700;padding:6px 14px;border-radius:9999px;border:2px solid rgba(255,255,255,0.9);box-shadow:0 10px 20px rgba(0,0,0,0.25);text-transform:uppercase;font-size:11px;letter-spacing:0.08em;">
          Capture prête
        </div>
        <div style="background:#fff;border-radius:14px;padding:6px 10px;font-size:11px;font-weight:600;color:#1f2a24;box-shadow:0 8px 16px rgba(0,0,0,0.2);">
          ${animal.name}
        </div>
      </div>
    `,
    iconSize: [120, 80],
    iconAnchor: [60, 70],
  });

interface ZooMapProps {
  animals: Animal[];
  onAnimalClick: (animal: Animal) => void;
  onUserLocation?: (position: [number, number]) => void;
  onGeoError?: (message: string) => void;
  pois?: Poi[];
  height?: number | string;
  locationEnabled?: boolean;
  visitedEnclosures?: string[];
  activeEnclosureId?: string | null;
}

export default function ZooMap({
  animals,
  onAnimalClick,
  onUserLocation,
  onGeoError,
  pois,
  height,
  locationEnabled = true,
  visitedEnclosures,
  activeEnclosureId,
}: ZooMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const isGeoSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
  const [geoError, setGeoError] = useState<string | null>(
    () => (isGeoSupported ? null : GEO_UNSUPPORTED_MESSAGE)
  );
  const [poiFilters, setPoiFilters] = useState<Record<Poi['category'], boolean>>(() =>
    poiCategories.reduce(
      (acc, category) => {
        acc[category] = true;
        return acc;
      },
      {} as Record<Poi['category'], boolean>
    )
  );
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [initialCenter, setInitialCenter] = useState<[number, number]>(FALLBACK_CENTER);
  const mapRef = useRef<L.Map | null>(null);



  const visitedSet = useMemo(() => new Set(visitedEnclosures ?? []), [visitedEnclosures]);
  const filteredPois = useMemo(() => {
    if (!pois || pois.length === 0) {
      return [] as Poi[];
    }
    return pois.filter((poi) => poi.id !== KM0_LIVE_HUB_ID && poiFilters[poi.category]);
  }, [pois, poiFilters]);
  const activeFilterCount = useMemo(
    () => poiCategories.reduce((count, category) => (poiFilters[category] ? count + 1 : count), 0),
    [poiFilters]
  );

  const handlePoiFilterToggle = useCallback((category: Poi['category']) => {
    setPoiFilters((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const toggleFilterMenu = useCallback(() => {
    setFilterMenuOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!pois || pois.length === 0) {
      setFilterMenuOpen(false);
    }
  }, [pois]);

  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
      setUserPosition(coords);
      setUserAccuracy(position.coords.accuracy);
      setGeoError(null);
      setInitialCenter(coords);
      onUserLocation?.(coords);
    },
    [onUserLocation]
  );

  const handlePositionError = useCallback(
    (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      let message = 'Impossible de récupérer votre position.';
      if (error.code === 1) {
        message = 'Autorise la localisation pour débloquer les alertes de proximité.';
      } else if (error.code === 2) {
        message = 'Position temporairement indisponible.';
      } else if (error.code === 3) {
        message = 'La recherche de position a expiré, réessaie.';
      }
      setGeoError(message);
      onGeoError?.(message);
    },
    [onGeoError]
  );

  const requestManualLocation = useCallback(() => {
    if (!locationEnabled) {
      const message = 'La localisation est désactivée dans les paramètres.';
      setGeoError(message);
      onGeoError?.(message);
      return;
    }
    if (!isGeoSupported || typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError(GEO_UNSUPPORTED_MESSAGE);
      onGeoError?.(GEO_UNSUPPORTED_MESSAGE);
      return;
    }
    navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, GEO_OPTIONS);
  }, [handlePositionError, handlePositionSuccess, isGeoSupported, locationEnabled, onGeoError]);

  const handleRecenter = useCallback(() => {
    const hasUserFix = Boolean(locationEnabled && userPosition);
    const rawTarget = hasUserFix ? (userPosition as [number, number]) : FALLBACK_CENTER;
    const target: [number, number] = [rawTarget[0], rawTarget[1]];
    setInitialCenter(target);

    const map = mapRef.current;
    if (map) {
      const targetZoom = hasUserFix ? Math.max(map.getZoom(), 17) : Math.max(map.getZoom(), 16);
      map.flyTo(target, targetZoom, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.2,
      });
    }

    if (!hasUserFix && locationEnabled) {
      requestManualLocation();
    }
  }, [locationEnabled, requestManualLocation, userPosition]);

  useEffect(() => {
    if (!isGeoSupported) {
      onGeoError?.(GEO_UNSUPPORTED_MESSAGE);
    }
  }, [isGeoSupported, onGeoError]);

  useEffect(() => {
    if (!locationEnabled) {
      setUserPosition(null);
      setUserAccuracy(null);
      setInitialCenter(FALLBACK_CENTER);
      
      
      return;
    }

    if (!isGeoSupported || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, GEO_OPTIONS);
    const watchId = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      GEO_OPTIONS
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [handlePositionError, handlePositionSuccess, isGeoSupported, locationEnabled]);

  useEffect(() => {
    if (!userPosition || !mapRef.current) {
      return;
    }
    const map = mapRef.current;
    // Only fly to user position on updates, not on initial load
    if (map.getZoom() > 0) {
      const targetZoom = Math.max(map.getZoom(), 17);
      map.flyTo(userPosition, targetZoom, { duration: 0.8 });
    }
  }, [userPosition]);

  return (
    <div
      className="relative w-full"
      style={{ height: height ?? '100%' }}
    >
      <MapContainer
        center={initialCenter}
        zoom={userPosition ? 17 : 16}
        minZoom={15}
        maxZoom={18}
        zoomSnap={0.25}
        zoomDelta={0.5}
        scrollWheelZoom
        doubleClickZoom
        touchZoom="center"
        dragging
        inertia
        inertiaDeceleration={3000}
        className="h-full w-full"
        style={{ height: '100%' }}
        zoomControl
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
          maxNativeZoom={18}
        />

        

        {animals.map((animal) => {
          if (!visitedSet.has(animal.id)) {
            return null;
          }
          return (
            <Circle
              key={`${animal.id}-enclosure`}
              center={animal.enclosure.position}
              radius={animal.enclosure.radius}
              pathOptions={{
                color: '#0f9d58',
                fillColor: '#0f9d58',
                fillOpacity: 0.12,
                dashArray: '8 8',
              }}
            />
          );
        })}

        {activeEnclosureId &&
          animals
            .filter((animal) => animal.id === activeEnclosureId)
            .map((animal) => (
              <Marker
                key={`${animal.id}-badge`}
                position={animal.enclosure.position}
                icon={createEnclosureBadgeIcon(animal)}
                interactive={false}
              />
            ))}

        {filteredPois.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.latitude, poi.longitude]}
            icon={createPoiIcon(poi.category)}
          >
            <Popup>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{poi.name}</h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ backgroundColor: poiColors[poi.category] }}
                  >
                    {poiLabels[poi.category]}
                  </span>
                </div>
                {poi.imageUrl && (
                  <img
                    src={poi.imageUrl}
                    alt={poi.name}
                    className="h-32 w-full rounded-md object-cover"
                    loading="lazy"
                  />
                )}
                {poi.description && (
                  <div
                    className="space-y-2 text-xs text-gray-600"
                    dangerouslySetInnerHTML={{ __html: poi.description }}
                  />
                )}
                {poi.linkUrl && (
                  <a
                    href={poi.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Plus d’informations ↗
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {userPosition && (
          <>
            <Marker position={userPosition} icon={userLocationIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
            {userAccuracy && (
              <Circle
                center={userPosition}
                radius={userAccuracy}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#2563eb',
                  fillOpacity: 0.15,
                  weight: 1.5,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
      {pois && pois.length > 0 && (
        <div className="pointer-events-none absolute right-4 top-4 z-[1000] flex flex-col items-end gap-2">
          <button
            type="button"
            className="pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/95 text-lg text-slate-900 shadow"
            onClick={toggleFilterMenu}
            aria-expanded={filterMenuOpen}
            aria-label="Afficher les filtres"
          >
            <span aria-hidden>🎯</span>
            <span className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-[#0d4f4a] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
              {activeFilterCount}
            </span>
          </button>
          {filterMenuOpen && (
            <div className="pointer-events-auto w-48 rounded-2xl border border-white/70 bg-white/95 p-2 text-xs text-slate-800 shadow-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Points d’intérêt</p>
              <div className="mt-1 space-y-1.5">
                {poiCategories.map((category) => {
                  const active = poiFilters[category];
                  return (
                    <button
                      key={category}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 font-semibold ${
                        active ? 'bg-[#0d4f4a] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                      onClick={() => handlePoiFilterToggle(category)}
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden>{poiGlyphs[category]}</span>
                        {poiLabels[category]}
                      </span>
                      <span className="text-xs uppercase tracking-wide">{active ? 'On' : 'Off'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="pointer-events-none absolute right-4 z-[1000]" style={{ bottom: '210px' }}>
        <button
          type="button"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white text-xl text-[#0d4f4a] shadow transition hover:bg-white/90"
          onClick={handleRecenter}
          aria-label="Recentrer la carte"
        >
          <span aria-hidden>📍</span>
        </button>
      </div>
      {geoError && (
        <div className="absolute bottom-4 right-4 z-[1000] max-w-xs rounded-md bg-white/90 px-3 py-2 text-xs font-medium text-red-600 shadow">
          {geoError}
        </div>
      )}
      {!geoError && !userPosition && (
        <div className="absolute bottom-4 left-4 z-[1000] max-w-xs rounded-xl bg-white/95 p-3 text-xs text-gray-700 shadow">
          <p className="mb-2 font-semibold text-gray-900">Active ta localisation pour les alertes météo & proximité.</p>
          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-blue-500"
            onClick={requestManualLocation}
          >
            Demander l&rsquo;accès
          </button>
        </div>
      )}
    </div>
  );
}