'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
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

const createPoiIcon = (category: Poi['category']) =>
  L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="
        background-color: ${poiColors[category]};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 26px;
      height: 26px;
      background: #2563eb;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 6px 12px rgba(37, 99, 235, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ffffff;
        display: block;
      "></span>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const GEO_UNSUPPORTED_MESSAGE = "La géolocalisation n'est pas supportée par ce navigateur.";

interface ZooMapProps {
  animals: Animal[];
  onAnimalClick: (animal: Animal) => void;
  onUserLocation?: (position: [number, number]) => void;
  onGeoError?: (message: string) => void;
  bounds?: LatLngBoundsExpression;
  pois?: Poi[];
}

const defaultBounds: LatLngBoundsExpression = [
  [47.7288, 7.3425],
  [47.7349, 7.3528],
];

export default function ZooMap({
  animals,
  onAnimalClick,
  onUserLocation,
  onGeoError,
  bounds,
  pois,
}: ZooMapProps) {
  void animals;
  void onAnimalClick;
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const isGeoSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
  const [geoError, setGeoError] = useState<string | null>(
    () => (isGeoSupported ? null : GEO_UNSUPPORTED_MESSAGE)
  );
  const [hasCenteredUser, setHasCenteredUser] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapBounds = useMemo(() => bounds ?? defaultBounds, [bounds]);

  useEffect(() => {
    if (!isGeoSupported) {
      onGeoError?.(GEO_UNSUPPORTED_MESSAGE);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPosition(coords);
        setUserAccuracy(position.coords.accuracy);
        setGeoError(null);
        onUserLocation?.(coords);

        if (!hasCenteredUser && mapRef.current) {
          mapRef.current.flyTo(coords, 17, { duration: 1.2 });
          setHasCenteredUser(true);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        const message = 'Impossible de récupérer votre position.';
        setGeoError(message);
        onGeoError?.(message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [hasCenteredUser, isGeoSupported, onGeoError, onUserLocation]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[47.7315751, 7.347215]}
        zoom={16}
        minZoom={15}
        maxZoom={19}
        zoomSnap={0.25}
        zoomDelta={0.5}
        scrollWheelZoom
        doubleClickZoom
        touchZoom="center"
        dragging
        inertia
        inertiaDeceleration={3000}
        className="w-full"
        style={{ minHeight: '65vh', height: '100%' }}
        zoomControl
        maxBounds={mapBounds}
        maxBoundsViscosity={0.35}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pois?.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.latitude, poi.longitude]}
            icon={createPoiIcon(poi.category)}
          >
            <Popup>
              <div className="space-y-2 text-sm">
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
                    Plus d&rsquo;informations ↗
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

      {geoError && (
        <div className="absolute bottom-4 right-4 z-[1000] rounded-md bg-white/90 px-3 py-2 text-xs font-medium text-red-600 shadow">
          {geoError}
        </div>
      )}
      {!geoError && !userPosition && (
        <div className="absolute bottom-4 right-4 z-[1000] rounded-md bg-white/90 px-3 py-2 text-xs font-medium text-gray-700 shadow">
          Activation de la localisation...
        </div>
      )}
    </div>
  );
}