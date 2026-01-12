'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
import { Animal } from '@/types/zoo';
import { useEffect, useState } from 'react';

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

interface ZooMapProps {
  animals: Animal[];
  onAnimalClick: (animal: Animal) => void;
}

export default function ZooMap({ animals, onAnimalClick }: ZooMapProps) {
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
      center={[47.7315751, 7.347215]} // Centre du Zoo de Mulhouse
      zoom={16}
      className="w-full h-screen"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {animals.map((animal) => (
        <Marker
          key={animal.id}
          position={animal.position}
          icon={createCustomIcon(animal.category)}
          eventHandlers={{
            click: () => onAnimalClick(animal),
          }}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-bold">{animal.name}</h3>
              <p className="text-sm text-gray-600">{animal.species}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}