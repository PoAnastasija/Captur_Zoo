'use client';

import dynamic from 'next/dynamic';
import { pois } from '@/app/data/pois';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const ZooMap = dynamic(() => import('@/components/ui/ZooMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Chargement de la carte...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white shadow-md">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-gray-800">
            🦁 Zoo de Mulhouse
          </h1>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {/* Carte */}
      <div className="pt-16">
        <ZooMap pois={pois} />
      </div>

      {/* Légende */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg text-xs space-y-3">
        <h3 className="font-semibold mb-2 text-sm">Points d'intérêt</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#b45309' }}></div>
            <span>Zonages animaux</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#15803d' }}></div>
            <span>Plantes & jardins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1d4ed8' }}></div>
            <span>Services & pratique</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6b7280' }}></div>
            <span>Autres</span>
          </div>
        </div>
      </div>
    </main>
  );
}