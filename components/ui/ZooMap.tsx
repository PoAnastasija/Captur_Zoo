'use client';

import { Poi } from '@/types/zoo';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix pour les icônes Leaflet avec Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const poiColors: Record<Poi['category'], string> = {
  animals: '#b45309',
  plants: '#15803d',
  practical: '#1d4ed8',
  other: '#6b7280'
};

const poiLabels: Record<Poi['category'], string> = {
  animals: 'Animaux',
  plants: 'Plantes & jardins',
  practical: 'Services',
  other: 'Autres'
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

interface ZooMapProps {
  pois: Poi[];
}

export default function ZooMap({ pois }: ZooMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[47.7349, 7.3498]} // Centre ajusté sur les POI fournis
      zoom={16}
      className="w-full h-screen"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pois.map((poi) => (
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
                  className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: poiColors[poi.category] }}
                >
                  {poiLabels[poi.category]}
                </span>
              </div>
              {poi.imageUrl && (
                <img
                  src={poi.imageUrl}
                  alt={poi.name}
                  className="w-full h-32 object-cover rounded-md"
                  loading="lazy"
                />
              )}
              {poi.description && (
                <div
                  className="text-xs text-gray-600 space-y-2"
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
                  Plus d'informations ↗
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}