"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { Animal, CaptureIntent, PhotoAnalysisState } from '@/app/types/zoo';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface PhotoGalleryProps {
  animals: Animal[];
  capturedAnimals: string[];
  capturedEnclosures: string[];
  open: boolean;
  onClose: () => void;
  onUploadPhoto: (file: File, intent: CaptureIntent) => Promise<boolean>;
  cameraEnabled: boolean;
  analysisState: PhotoAnalysisState;
}

export function PhotoGallery({
  animals,
  open,
  onClose,
  onUploadPhoto,
  cameraEnabled,
  analysisState,
}: PhotoGalleryProps) {
  const uniqueAnimals = useMemo(
    () => Array.from(new Map(animals.map((animal) => [animal.id, animal])).values()),
    [animals]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingCaptureRef = useRef<CaptureIntent | null>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  const isAnalyzing = analysisState.status === 'pending';
  const analysisMessage = analysisState.message ?? 'Analyse automatique en cours...';

  const handleManualCapture = (intent: CaptureIntent) => {
    if (!cameraEnabled || isAnalyzing) {
      return;
    }
    pendingCaptureRef.current = intent;
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (uniqueAnimals.length === 0) {
      setSelectedAnimalId(null);
      return;
    }
    setSelectedAnimalId((current) => {
      if (current && uniqueAnimals.some((animal) => animal.id === current)) {
        return current;
      }
      return uniqueAnimals[0]?.id ?? null;
    });
  }, [uniqueAnimals]);

  const handleAnimalCaptureClick = () => {
    if (!selectedAnimalId) {
      return;
    }
    handleManualCapture({ step: 'animal', animalId: selectedAnimalId });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    const pending = pendingCaptureRef.current;
    if (!file || !pending) {
      input.value = '';
      return;
    }

    try {
      await onUploadPhoto(file, pending);
    } catch (error) {
      console.error('Photo upload failed', error);
    } finally {
      pendingCaptureRef.current = null;
      input.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-screen max-h-screen w-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-[#fff9f0] p-0"
      >
        <div className="flex h-full flex-col bg-[#fff9f0]">
          <div className="flex items-center justify-between border-b border-[#f0dfc3] bg-gradient-to-r from-[#fff3da] to-[#ffe8c0] px-4 py-4 sm:px-6">
            <div>
              <DialogTitle className="text-2xl font-bold text-[#1f2a24]">Galerie immersive</DialogTitle>
              <DialogDescription className="text-sm text-[#4f5c55]">
                Lance une capture du panneau ou de l’animal pour alimenter ton Zoodex.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-[#d8c5a7] px-4 py-2 text-xs font-semibold text-[#4c3c2c] transition hover:bg-white/70"
              >
                Fermer
              </button>
            </DialogClose>
          </div>
          <div className="flex flex-1 items-start justify-center px-4 pt-4 pb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={!cameraEnabled}
              onChange={handleFileChange}
            />
            {uniqueAnimals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#e4d5be] bg-white/60 px-6 py-12 text-center text-sm text-[#7a6f60]">
                Ajoute des animaux au Zoodex pour activer la capture photo.
              </div>
            ) : (
              <div className="flex w-full max-w-md flex-col gap-4">
                <button
                  type="button"
                  disabled={!cameraEnabled || isAnalyzing}
                  onClick={() => handleManualCapture({ step: 'enclosure' })}
                  className={`rounded-3xl border border-[#f3e3c6] bg-[#fff8ec] p-5 text-left shadow-sm transition ${
                    !cameraEnabled || isAnalyzing ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#a6611b]">
                    <span>Étape 1 · Panneau</span>
                    <CheckCircle2 className="h-4 w-4 text-[#f3c37c]" />
                  </div>
                  <p className="mt-3 text-sm text-[#715a3b]">
                    Cadre le panneau officiel : l’enclos est automatiquement identifié avant la capture de l’animal.
                  </p>
                  <div className="mt-4 rounded-2xl bg-white/90 px-3 py-2 text-sm font-semibold text-[#5a3516]">
                    {!cameraEnabled
                      ? 'Caméra désactivée'
                      : isAnalyzing
                      ? analysisMessage
                      : 'Scanner un panneau'}
                  </div>
                </button>
                <div className="rounded-3xl border border-[#d0e7cf] bg-white/90 p-4 text-sm text-[#163728] shadow-sm">
                  <label htmlFor="animal-selector" className="text-xs font-semibold uppercase tracking-wide text-[#0d5c3a]">
                    Choisis l’animal à capturer
                  </label>
                  <select
                    id="animal-selector"
                    value={selectedAnimalId ?? ''}
                    onChange={(event) => setSelectedAnimalId(event.target.value || null)}
                    className="mt-2 w-full rounded-2xl border border-[#b6d8ba] bg-white px-3 py-2 text-sm font-medium text-[#0f2b1c] focus:border-[#0d5c3a] focus:outline-none"
                  >
                    <option value="" disabled>
                      Sélectionner un animal
                    </option>
                    {uniqueAnimals.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[#476456]">
                    L’IA vérifiera que la photo correspond bien à l’animal choisi.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!cameraEnabled || isAnalyzing || !selectedAnimalId}
                  onClick={handleAnimalCaptureClick}
                  className={`rounded-3xl border border-[#d0e7cf] bg-[#f2fff4] p-5 text-left shadow-sm transition ${
                    !cameraEnabled || isAnalyzing || !selectedAnimalId
                      ? 'cursor-not-allowed opacity-60'
                      : 'hover:-translate-y-0.5 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#0d5c3a]">
                    <span>Étape 2 · Animal</span>
                    <Circle className="h-4 w-4 text-[#7fbf8a]" />
                  </div>
                  <p className="mt-3 text-sm text-[#1f3b2a]">
                    Prends la meilleure photo possible : le backend identifie automatiquement l’habitant rencontré.
                  </p>
                  <div className="mt-4 rounded-2xl bg-white/95 px-3 py-2 text-sm font-semibold text-[#103622]">
                    {!cameraEnabled
                      ? 'Caméra désactivée'
                      : isAnalyzing
                      ? analysisMessage
                      : selectedAnimalId
                      ? 'Photographier un animal'
                      : 'Choisis un animal'}
                  </div>
                </button>
                {!cameraEnabled && (
                  <div className="flex items-center gap-2 rounded-2xl bg-[#fef1f1] px-4 py-3 text-xs text-[#983737]">
                    <Lock className="h-3.5 w-3.5" />
                    Active la caméra dans les réglages pour utiliser ces boutons.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
