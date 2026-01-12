'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { animals } from './data/animals';
// import { Animal } from '@/types/zoo';
import { Animal } from './types/zoo';
import AnimalModal from '../components/ui/AnimalModal';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';


const ZooMap = dynamic(() => import('../components/ui/ZooMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Chargement de la carte...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };

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
        <ZooMap animals={animals} onAnimalClick={handleAnimalClick} />
      </div>

      {/* Modal */}
      <AnimalModal
        animal={selectedAnimal}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Légende */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-semibold mb-2 text-sm">Légende</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Mammifères</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Oiseaux</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Reptiles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Amphibiens</span>
          </div>
        </div>
      </div>
    </main>
  );
}