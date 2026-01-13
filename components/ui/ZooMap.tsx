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

const crowdLevelColor: Record<Animal['crowdLevel'], { fill: string; border: string; glyph: string }> = {
  low: { fill: '#d1fae5', border: '#059669', glyph: '🟢' },
  moderate: { fill: '#fef3c7', border: '#d97706', glyph: '🟠' },
  high: { fill: '#fee2e2', border: '#dc2626', glyph: '🔴' },
};

const createAnimalIcon = (animal: Animal) => {
    const crowdMeta = crowdLevelColor[animal.crowdLevel];
    const occupancy = Math.round((animal.visitorCount / animal.capacity) * 100);
    return L.divIcon({
      className: 'animal-pin',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:14px;background:${crowdMeta.fill};border:2px solid ${crowdMeta.border};box-shadow:0 6px 12px rgba(0,0,0,0.25);font-size:16px;line-height:1;">
            ${crowdMeta.glyph}
          </span>
          <span style="padding:2px 6px;border-radius:9999px;background:#111827;color:#fff;font-size:10px;font-weight:600;">${occupancy}%</span>
        </div>
      `,
      iconSize: [40, 48],
      iconAnchor: [20, 40],
    });
  };

const GEO_UNSUPPORTED_MESSAGE = "La géolocalisation n'est pas supportée par ce navigateur.";

interface ZooMapProps {
  animals: Animal[];
  onAnimalClick: (animal: Animal) => void;
  onUserLocation?: (position: [number, number]) => void;
  onGeoError?: (message: string) => void;
  pois?: Poi[];
  height?: number | string;
  locationEnabled?: boolean;
}

export default function ZooMap({
  animals,
  onAnimalClick,
  onUserLocation,
  onGeoError,
  pois,
  height,
  locationEnabled = true,
}: ZooMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const isGeoSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
  const [geoError, setGeoError] = useState<string | null>(
    () => (isGeoSupported ? null : GEO_UNSUPPORTED_MESSAGE)
  );
  const mapRef = useRef<L.Map | null>(null);

  const crowdStats = useMemo(() => {
    const totalCapacity = animals.reduce((sum, animal) => sum + animal.capacity, 0);
    const totalVisitors = animals.reduce((sum, animal) => sum + animal.visitorCount, 0);
    const saturatedZones = animals.filter((animal) => animal.crowdLevel === 'high').length;
    return {
      visitors: totalVisitors,
      capacity: totalCapacity,
      occupancy: totalCapacity ? Math.round((totalVisitors / totalCapacity) * 100) : 0,
      saturatedZones,
    };
  }, [animals]);

  const animalIcons = useMemo(() => {
    const iconMap = new Map<string, L.DivIcon>();
    animals.forEach((animal) => {
      iconMap.set(animal.id, createAnimalIcon(animal));
    });
    return iconMap;
  }, [animals]);

  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
      setUserPosition(coords);
      setUserAccuracy(position.coords.accuracy);
      setGeoError(null);
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

  useEffect(() => {
    if (!isGeoSupported) {
      onGeoError?.(GEO_UNSUPPORTED_MESSAGE);
    }
  }, [isGeoSupported, onGeoError]);

  useEffect(() => {
    if (!locationEnabled) {
      setUserPosition(null);
      setUserAccuracy(null);
      setOutOfBoundsNotice(null);
      lockMapToUser(false);
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
  }, [handlePositionError, handlePositionSuccess, isGeoSupported, locationEnabled, lockMapToUser]);

  useEffect(() => {
    if (!userPosition || !mapRef.current) {
      return;
    }
    const map = mapRef.current;
    const targetZoom = Math.max(map.getZoom(), 17);
    map.flyTo(userPosition, targetZoom, { duration: 0.8 });
  }, [userPosition]);

  return (
    <div
      className="relative w-full"
      style={{ height: height ?? '100%' }}
    >
      <MapContainer
        center={FALLBACK_CENTER}
        zoom={16}
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
          const icon = animalIcons.get(animal.id) ?? createAnimalIcon(animal);
          return (
            <Marker
              key={animal.id}
              position={animal.position}
              icon={icon}
              eventHandlers={{
                click: () => onAnimalClick(animal),
              }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="text-xs uppercase tracking-wider text-gray-400">{animal.zoneName}</p>
                  <h3 className="text-base font-semibold text-gray-900">{animal.name}</h3>
                  <p className="text-xs text-gray-500">{animal.species}</p>
                  <p className="text-xs text-gray-600">
                    {animal.visitorCount} / {animal.capacity} visiteurs · Affluence {animal.crowdLevel === 'high'
                      ? 'élevée'
                      : animal.crowdLevel === 'moderate'
                      ? 'soutenue'
                      : 'fluide'}
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-gray-300"
                    onClick={() => onAnimalClick(animal)}
                  >
                    Voir la fiche
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {pois?.map((poi) => {
          const isLiveHub = poi.id === KM0_LIVE_HUB_ID;
          return (
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
                  {isLiveHub ? (
                    <div className="space-y-3 text-gray-900">
                      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                        <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-300">Live</p>
                        <p className="text-3xl font-bold">{crowdStats.visitors}</p>
                        <p className="text-xs text-slate-300">visiteurs connectes</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-emerald-50 p-3 text-center">
                          <p className="text-lg font-semibold text-emerald-700">{crowdStats.occupancy}%</p>
                          <p>parc occupe</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-3 text-center">
                          <p className="text-lg font-semibold text-amber-700">{crowdStats.saturatedZones}</p>
                          <p>zones critiques</p>
                        </div>
                      </div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
                        Derniere mise a jour {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

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