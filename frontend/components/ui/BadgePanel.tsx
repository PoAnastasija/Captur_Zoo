'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Animal } from '@/app/types/zoo';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAuthToken } from '@/components/ui/AuthButton';

interface ZoodexPanelProps {
  animals: Animal[];
  capturedAnimals: string[];
  capturedEnclosures: string[];
  open: boolean;
  onClose: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost';
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || '3001';

interface RemoteAnimal {
  name: string;
  latitude: number;
  longitude: number;
  image: string | null;
  icon?: string | null;
  type?: string;
  unlocked?: boolean;
}

interface GalleryCard {
  id: string;
  name: string;
  image: string;
  captured: boolean;
  detailSource?: Animal;
  icon?: string | null;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300?text=Animal';

export function ZoodexPanel({
  animals,
  capturedAnimals,
  capturedEnclosures,
  open,
  onClose,
}: ZoodexPanelProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [remoteAnimals, setRemoteAnimals] = useState<RemoteAnimal[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  const uniqueAnimals = useMemo(
    () => Array.from(new Map(animals.map((animal) => [animal.id, animal])).values()),
    [animals]
  );
  const capturedSet = useMemo(() => new Set([...capturedAnimals, ...capturedEnclosures]), [capturedAnimals, capturedEnclosures]);
  const fallbackGallery = useMemo<GalleryCard[]>(() => {
    return uniqueAnimals.slice(0, 3).map((animal) => ({
      id: animal.id,
      name: animal.name,
      image: animal.image,
      captured: capturedSet.has(animal.id),
      detailSource: animal,
    }));
  }, [capturedSet, uniqueAnimals]);

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
  };

  const remoteGallery = useMemo<GalleryCard[] | null>(() => {
    if (!remoteAnimals || remoteAnimals.length === 0) {
      return null;
    }
    return remoteAnimals.map((animal, index) => ({
      id: `remote-${index}-${animal.name}`,
      name: animal.name,
      image: animal.image ?? PLACEHOLDER_IMAGE,
      captured: Boolean(animal.unlocked),
      icon: animal.icon ?? null,
    }));
  }, [remoteAnimals]);

  const stats = useMemo(() => {
    const source = remoteGallery && remoteGallery.length > 0 ? remoteGallery : fallbackGallery;
    const capturedCount = source.filter((animal) => animal.captured).length;
    return {
      captured: capturedCount,
      total: source.length,
    };
  }, [fallbackGallery, remoteGallery]);

  const displayCards = remoteGallery && remoteGallery.length > 0 ? remoteGallery : fallbackGallery;

  useEffect(() => {
    if (!open) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setAuthRequired(true);
      setRemoteAnimals(null);
      setRemoteLoading(false);
      return;
    }

    const controller = new AbortController();
    setAuthRequired(false);
    setRemoteLoading(true);
    setRemoteError(null);

    const fetchUserAnimals = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}:${BACKEND_PORT}/api/user/animals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            setAuthRequired(true);
            setRemoteAnimals(null);
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erreur ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Réponse inattendue du serveur');
        }
        setRemoteAnimals(data as RemoteAnimal[]);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        setRemoteError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setRemoteLoading(false);
      }
    };

    fetchUserAnimals();

    return () => controller.abort();
  }, [open]);

  const isCaptured = selectedAnimal ? capturedSet.has(selectedAnimal.id) : false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-screen max-h-screen w-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-linear-to-b from-[#fdf5e3] via-[#fbedd2] to-[#f9e1b7] p-0"
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/40 px-4 py-4 sm:px-6">
            <div>
              <DialogTitle className="text-3xl font-bold text-[#1f2a24]">Galerie des animaux</DialogTitle>
              <DialogDescription className="text-[#4a5a51]">
                Découvre les animaux du zoo et débloque-les en les photographiant.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-[#d2c4ab] px-4 py-2 text-xs font-semibold text-[#4c3c2c] transition hover:bg-white/60"
              >
                Fermer
              </button>
            </DialogClose>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mb-4 rounded-lg border border-white/60 bg-white/80 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#0d4f4a]">Animaux capturés</p>
              <p className="mt-2 text-3xl font-bold text-[#1d2c27]">{stats.captured} / {stats.total}</p>
            </div>
            {authRequired && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Connecte-toi pour synchroniser ta progression et ta galerie personnalisée.
              </div>
            )}
            {remoteError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {remoteError}
              </div>
            )}
            {remoteLoading && (
              <div className="mb-4 rounded-lg border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#1f2a24]">
                Chargement de ta galerie...
              </div>
            )}
            <div className="w-full rounded-lg p-3 sm:p-4 md:p-6">
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                {displayCards.map((card) => {
                  const captured = card.captured;
                  const isInteractive = Boolean(card.detailSource);
                  const assetSrc = captured ? card.image : card.icon ?? card.image;
                  const assetAlt = captured ? card.name : `Icône ${card.name}`;
                  const shouldDesaturate = !captured && !card.icon;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => card.detailSource && handleAnimalClick(card.detailSource)}
                      disabled={!isInteractive}
                      className={`w-full flex overflow-hidden bg-white/80 border border-white/60 rounded-3xl shadow-sm text-left h-32 sm:h-40 transition-all duration-200 ${
                        isInteractive ? 'hover:bg-white/95 hover:shadow-md hover:scale-105 active:scale-95' : 'opacity-90 cursor-default'
                      }`}
                    >
                      {/* Image - Left side with 100% height */}
                      <div className={`relative w-32 sm:w-40 flex-shrink-0 ${captured ? 'bg-white' : 'bg-gray-100'}`}>
                        <Image
                          src={assetSrc}
                          alt={assetAlt}
                          fill
                            className={`object-cover transition-all ${shouldDesaturate ? 'grayscale opacity-70' : ''}`}
                          sizes="(max-width: 640px) 128px, 160px"
                        />
                      </div>

                      {/* Info - Right side */}
                      <div className="flex-1 flex flex-col gap-2 sm:gap-3 justify-center p-4 sm:p-5">
                        <div>
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#1f2a24] line-clamp-1">
                            {card.name}
                          </h3>
                        </div>

                        {/* Capture Status */}
                        <div className="flex gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                            captured ? 'bg-[#e1f6d9] text-[#1d6432]' : 'bg-[#fff1d9] text-[#8a4b12]'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${captured ? 'bg-[#1d6432]' : 'bg-[#8a4b12]'}`} />
                            {captured ? 'Capturé' : 'Non capturé'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedAnimal && (
              <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
                <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="space-y-4">
                    <div className="relative w-full h-48 sm:h-72 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={selectedAnimal.image}
                        alt={selectedAnimal.name}
                        fill
                        className={`object-contain p-4 transition-all ${isCaptured ? '' : 'grayscale opacity-70'}`}
                        sizes="500px"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold">{selectedAnimal.name}</h2>
                        <p className="text-sm text-gray-600">{selectedAnimal.species}</p>
                        <p className="text-xs text-gray-500 mt-1">{selectedAnimal.zoneName}</p>
                      </div>

                      <div className={`p-3 rounded-lg ${isCaptured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        <p className="font-semibold text-sm">{isCaptured ? '✓ Animal débloqué' : 'Non débloqué - Photographie cet animal'}</p>
                      </div>

                      {selectedAnimal.description && (
                        <div>
                          <h3 className="font-semibold text-sm mb-1">À propos</h3>
                          <p className="text-sm text-gray-700">{selectedAnimal.description}</p>
                        </div>
                      )}

                      {selectedAnimal.funFact && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <h3 className="font-semibold text-sm mb-1">💡 Anecdote</h3>
                          <p className="text-sm text-blue-900">{selectedAnimal.funFact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
