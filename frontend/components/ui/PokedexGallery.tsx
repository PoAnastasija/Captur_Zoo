'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Animal } from '@/app/types/zoo';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PokedexGalleryProps {
  animals: Animal[];
  capturedAnimals: string[];
  capturedEnclosures: string[];
}

export function PokedexGallery({ animals, capturedAnimals, capturedEnclosures }: PokedexGalleryProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  const capturedSet = useMemo(() => new Set(capturedAnimals), [capturedAnimals]);
  const enclosureSet = useMemo(() => new Set(capturedEnclosures), [capturedEnclosures]);

  // Use only first 3 animals for testing
  const testAnimals = animals.slice(0, 3);

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
  };

  const isCaptured = selectedAnimal ? capturedSet.has(selectedAnimal.id) || enclosureSet.has(selectedAnimal.id) : false;

  return (
    <>
      <div className="w-full bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4 md:p-6">
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {testAnimals.map((animal) => {
            const captured = capturedSet.has(animal.id) || enclosureSet.has(animal.id);
            return (
              <button
                key={animal.id}
                onClick={() => handleAnimalClick(animal)}
                className={`relative group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-all duration-200 ease-out ${
                  captured
                    ? 'bg-gradient-to-b from-blue-300 to-blue-200 border-2 sm:border-3 border-blue-500 hover:from-blue-400 hover:to-blue-300 hover:shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-gradient-to-b from-gray-300 to-gray-200 border-2 sm:border-3 border-gray-400 hover:from-gray-350 hover:to-gray-250 opacity-60 hover:opacity-75 hover:scale-105 active:scale-95'
                }`}
              >
                {/* Pokéball Icon */}
                <div className="absolute -top-1 -right-1 sm:top-1 sm:right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full border border-white shadow-sm" />
                
                {/* Image Container */}
                <div className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 ${captured ? 'bg-white' : 'bg-gray-100'} rounded-md shadow-sm border border-white flex items-center justify-center overflow-hidden`}>
                  <Image
                    src={animal.image}
                    alt={animal.name}
                    fill
                    className={`object-contain p-1 transition-all ${captured ? '' : 'grayscale opacity-70'}`}
                    sizes="80px"
                  />
                </div>

                {/* Name */}
                <p className="text-xs sm:text-sm font-bold text-center line-clamp-2 leading-tight h-8 sm:h-10 flex items-center justify-center">
                  {animal.name}
                </p>

                {/* Capture Badge */}
                {captured && (
                  <span className="text-sm sm:text-base font-bold">✓</span>
                )}

                {/* Hover Indicator */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-yellow-400 pointer-events-none" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAnimal && (
        <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
          <DialogContent className="max-w-md sm:max-w-xl md:max-w-2xl bg-gradient-to-b from-blue-100 via-purple-50 to-blue-50 border-4 border-blue-400 rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <DialogTitle className="text-center text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 pr-8">
                {selectedAnimal.name}
              </DialogTitle>
              <DialogClose asChild>
                <button className="absolute right-0 top-0 text-2xl sm:text-3xl text-blue-600 hover:text-blue-900 font-bold w-8 h-8 flex items-center justify-center hover:bg-blue-200 rounded">
                  ✕
                </button>
              </DialogClose>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
              {/* Image */}
              <div className="flex items-center justify-center col-span-1">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl p-3 sm:p-4 border-4 border-blue-400 shadow-lg">
                  <Image
                    src={selectedAnimal.image}
                    alt={selectedAnimal.name}
                    fill
                    className="object-contain"
                    sizes="160px"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                  <p className="text-xs sm:text-sm font-bold text-blue-700">Espèce</p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-800">{selectedAnimal.species}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                  <p className="text-xs sm:text-sm font-bold text-blue-700">Zone</p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-800">{selectedAnimal.zoneName}</p>
                </div>
                <div className={`rounded-lg p-3 border-2 ${
                  isCaptured
                    ? 'bg-green-100 border-green-400'
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  <p className="text-xs sm:text-sm font-bold text-gray-700">Statut</p>
                  <p className={`text-sm sm:text-lg font-bold ${isCaptured ? 'text-green-600' : 'text-gray-500'}`}>
                    {isCaptured ? '✓ Débloqué' : '🔒 À découvrir'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="col-span-1 sm:col-span-2 bg-white rounded-lg p-3 sm:p-4 border-2 border-blue-300">
                <p className="text-xs sm:text-sm font-bold text-blue-700 mb-2">À propos</p>
                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">{selectedAnimal.description}</p>
              </div>

              {/* Fun Fact */}
              <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-yellow-100 to-yellow-50 p-3 sm:p-4 rounded-lg border-3 border-yellow-400 shadow-md">
                <p className="text-xs sm:text-sm font-bold text-yellow-800 mb-2">💡 Fait intéressant</p>
                <p className="text-xs sm:text-sm text-yellow-900 leading-relaxed font-semibold">{selectedAnimal.funFact}</p>
              </div>

              <Button
                onClick={() => setSelectedAnimal(null)}
                className="col-span-1 sm:col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 rounded-lg text-sm sm:text-base transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
