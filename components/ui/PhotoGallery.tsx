"use client";

import Image from 'next/image';
import { useRef } from 'react';
import { Animal } from '@/types/zoo';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PhotoGalleryProps {
  animals: Animal[];
  capturedIds: string[];
  open: boolean;
  onClose: () => void;
  onCapture: (animalId: string) => void;
  onUploadPhoto: (file: File) => void;
}

const categoryLabels: Record<Animal['category'], string> = {
  mammal: 'Mammifères',
  bird: 'Oiseaux',
  reptile: 'Reptiles',
  amphibian: 'Amphibiens',
};

export function PhotoGallery({ animals, capturedIds, open, onClose, onCapture, onUploadPhoto }: PhotoGalleryProps) {
  const uniqueAnimals = Array.from(
    new Map(animals.map((animal) => [animal.id, animal])).values()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAnimalRef = useRef<string | null>(null);

  const handleManualCapture = (animalId?: string) => {
    pendingAnimalRef.current = animalId ?? null;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadPhoto(file);
      if (pendingAnimalRef.current) {
        onCapture(pendingAnimalRef.current);
      }
      pendingAnimalRef.current = null;
      event.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-white p-0"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <DialogTitle className="text-2xl font-bold">Galerie immersive</DialogTitle>
              <DialogDescription>
                Explore les résidents du zoo et partage tes clichés favoris.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
              >
                Fermer
              </button>
            </DialogClose>
          </div>
          <div className="px-6 pb-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <Button size="sm" variant="outline" onClick={() => handleManualCapture()}>
                Activer l&rsquo;appareil photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-[11px] text-gray-500">
                Utilise ton téléphone pour capturer les animaux en réalité augmentée.
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueAnimals.map((animal) => {
                const isCaptured = capturedIds.includes(animal.id);
                return (
                  <div
                    key={animal.id}
                    className="group overflow-hidden rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={animal.image}
                        alt={animal.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-3 text-white">
                        <p className="text-sm font-semibold drop-shadow">{animal.name}</p>
                        <p className="text-xs opacity-80 drop-shadow">{animal.zoneName}</p>
                      </div>
                      {isCaptured && (
                        <div className="absolute top-2 right-2 rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                          Capturé
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-semibold text-gray-900">{animal.species}</span>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[animal.category]}
                      </Badge>
                    </div>
                    <div className="px-4 pb-4">
                      <Button
                        className="w-full"
                        variant={isCaptured ? 'secondary' : 'default'}
                        disabled={isCaptured}
                        onClick={() => handleManualCapture(animal.id)}
                      >
                        {isCaptured ? 'Déjà validé' : 'Scanner ce résident'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
