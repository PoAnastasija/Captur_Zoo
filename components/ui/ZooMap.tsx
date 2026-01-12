'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
import { Animal } from '@/types/zoo';
import { Fragment, useEffect, useRef, useState } from 'react';

// Fix pour les icônes Leaflet avec Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icônes personnalisées par catégorie
const createCustomIcon = (category: Animal['category']) => {
  const colors = {
    mammal: '#ef4444',
    bird: '#3b82f6',
    reptile: '#10b981',
    amphibian: '#8b5cf6'
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${colors[category]};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const crowdColors = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#ef4444',
};

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

interface ZooMapProps {
  animals: Animal[];
  onAnimalClick: (animal: Animal) => void;
  onUserLocation?: (position: [number, number]) => void;
  onGeoError?: (message: string) => void;
}

export default function ZooMap({ animals, onAnimalClick, onUserLocation, onGeoError }: ZooMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [hasCenteredUser, setHasCenteredUser] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const message = 'La géolocalisation n\'est pas supportée par ce navigateur.';
      setGeoError(message);
      onGeoError?.(message);
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
  }, [hasCenteredUser, isMounted, onGeoError, onUserLocation]);

  if (!isMounted) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={[47.7315751, 7.347215]} // Centre du Zoo de Mulhouse
        zoom={16}
        className="w-full h-full"
        zoomControl={true}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {animals.map((animal) => {
          const ratio = animal.visitorCount / animal.capacity;
          const circleRadius = 40 + ratio * 60;
          const crowdColor = crowdColors[animal.crowdLevel];

          return (
            <Fragment key={animal.id}>
              <Circle
                center={animal.position}
                radius={circleRadius}
                pathOptions={{
                  color: crowdColor,
                  fillColor: crowdColor,
                  fillOpacity: 0.12,
                  weight: 1.2,
                }}
              />
              <Marker
                position={animal.position}
                icon={createCustomIcon(animal.category)}
                eventHandlers={{
                  click: () => onAnimalClick(animal),
                }}
              >
                <Popup>
                  <div className="space-y-1 text-center">
                    <h3 className="font-bold">{animal.name}</h3>
                    <p className="text-sm text-gray-600">{animal.species}</p>
                    <p className="text-xs text-gray-500">{animal.zoneName}</p>
                    <p className="text-xs font-semibold" style={{ color: crowdColor }}>
                      Affluence {animal.crowdLevel === 'high' ? 'élevée' : animal.crowdLevel === 'moderate' ? 'modérée' : 'faible'} · {animal.visitorCount}/{animal.capacity} visiteurs
                    </p>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
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