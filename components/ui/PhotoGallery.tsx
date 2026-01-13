"use client";

import Image from 'next/image';
import { ChangeEvent, useMemo, useRef } from 'react';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { Animal, CaptureIntent } from '@/types/zoo';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface PhotoGalleryProps {
  animals: Animal[];
  capturedAnimals: string[];
  capturedEnclosures: string[];
  open: boolean;
  onClose: () => void;
  onCaptureAnimal: (animalId: string) => void;
  onCaptureEnclosure: (animalId: string) => void;
  onUploadPhoto: (file: File, intent: CaptureIntent) => void;
  cameraEnabled: boolean;
}

const categoryLabels: Record<Animal['category'], string> = {
  mammal: 'Mammifères',
  bird: 'Oiseaux',
  reptile: 'Reptiles',
  amphibian: 'Amphibiens',
};

export function PhotoGallery({
  animals,
  capturedAnimals,
  capturedEnclosures,
  open,
  onClose,
  onCaptureAnimal,
  onCaptureEnclosure,
  onUploadPhoto,
  cameraEnabled,
}: PhotoGalleryProps) {
  const uniqueAnimals = useMemo(
    () => Array.from(new Map(animals.map((animal) => [animal.id, animal])).values()),
    [animals]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingCaptureRef = useRef<CaptureIntent | null>(null);

  const handleManualCapture = (intent: CaptureIntent) => {
    if (!cameraEnabled) {
      return;
    }
    pendingCaptureRef.current = intent;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const pending = pendingCaptureRef.current;
    if (!file || !pending) {
      event.target.value = '';
      return;
    }
    onUploadPhoto(file, pending);
    if (pending.step === 'enclosure') {
      onCaptureEnclosure(pending.animalId);
    } else {
      onCaptureAnimal(pending.animalId);
    }
    pendingCaptureRef.current = null;
    event.target.value = '';
  };

  const enclosureSet = useMemo(() => new Set(capturedEnclosures), [capturedEnclosures]);
  const animalSet = useMemo(() => new Set(capturedAnimals), [capturedAnimals]);
  const totalAnimals = uniqueAnimals.length;
  const panelCount = enclosureSet.size;
  const animalCount = animalSet.size;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-screen max-h-screen w-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-[#fff9f0] p-0"
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#f0dfc3] bg-gradient-to-r from-[#fff3da] to-[#ffe8c0] px-4 py-4 sm:px-6">
            <div>
              <DialogTitle className="text-2xl font-bold text-[#1f2a24]">Galerie immersive</DialogTitle>
              <DialogDescription className="text-[#4f5c55]">
                Scanne d’abord le panneau de l’enclos, puis capture l’animal pour remplir ton Zoodex.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-[#d8c5a7] px-4 py-2 text-xs font-semibold text-[#4c3c2c] transition hover:bg-white/60"
              >
                Fermer
              </button>
            </DialogClose>
          </div>
          <div className="border-b border-[#efdec2] px-4 py-4 text-xs text-[#4f5c55] sm:px-6">
            <p className="text-[11px] text-[#827666]">
              Choisis le résident puis suis les deux étapes : panneau d’abord, animal ensuite. Chaque capture se sauvegarde dans
              ton Zoodex et sur ton appareil.
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-[#b08a62]">
              L’appareil photo natif est utilisé et le cliché est enregistré automatiquement dans ta galerie.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={!cameraEnabled}
              onChange={handleFileChange}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#f4e6cf] bg-white/70 px-4 py-3 text-sm text-[#5a3416] shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c47b1b]">Étape 1 · Panneau</p>
                <p className="mt-1 text-lg font-bold text-[#1f2a24]">{panelCount}/{totalAnimals} validés</p>
                <p className="text-xs text-[#6c5a46]">Scanne le panneau officiel pour déverrouiller la prise de vue.</p>
              </div>
              <div className="rounded-2xl border border-[#d7efda] bg-white/80 px-4 py-3 text-sm text-[#0d3b28] shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#0d7c55]">Étape 2 · Animal</p>
                <p className="mt-1 text-lg font-bold text-[#0f2b1c]">{animalCount}/{totalAnimals} capturés</p>
                <p className="text-xs text-[#1f4b33]">Immortalise l’habitant après validation du panneau.</p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueAnimals.map((animal) => {
                const enclosureCaptured = enclosureSet.has(animal.id);
                const animalCaptured = animalSet.has(animal.id);
                return (
                  <div
                    key={animal.id}
                    className="group overflow-hidden rounded-2xl border border-[#f0dfc3] bg-white/80 shadow-[0_12px_30px_rgba(17,64,54,0.08)]"
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
                      {animalCaptured && (
                        <div className="absolute top-2 right-2 rounded-full bg-[#7fba39]/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                          Animal capturé
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-semibold text-[#1f2a24]">{animal.species}</span>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[animal.category]}
                      </Badge>
                    </div>
                    <div className="space-y-3 px-4 pb-4 text-sm">
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                            enclosureCaptured ? 'bg-[#e1f6d9] text-[#1d6432]' : 'bg-[#fff1d9] text-[#8a4b12]'
                          }`}
                        >
                          {enclosureCaptured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                          Panneau
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                            animalCaptured ? 'bg-[#e1f6d9] text-[#1d6432]' : 'bg-[#fff1d9] text-[#8a4b12]'
                          }`}
                        >
                          {animalCaptured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                          Animal
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={!cameraEnabled || enclosureCaptured}
                          onClick={() => handleManualCapture({ step: 'enclosure', animalId: animal.id })}
                          className={`group/button w-full rounded-2xl border border-[#f3e3c6] bg-[#fff8ec] p-4 text-left shadow-sm transition ${
                            !cameraEnabled || enclosureCaptured ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-0.5 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#a6611b]">
                            <span>Étape 1 · Panneau</span>
                            {enclosureCaptured ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          </div>
                          <p className="mt-2 text-xs text-[#715a3b]">
                            Immortalise le panneau officiel pour débloquer la capture.
                          </p>
                          <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-[#5a3516]">
                            {enclosureCaptured ? 'Panneau validé' : cameraEnabled ? 'Scanner le panneau' : 'Caméra désactivée'}
                          </div>
                        </button>
                        <button
                          type="button"
                          disabled={!cameraEnabled || !enclosureCaptured || animalCaptured}
                          onClick={() => handleManualCapture({ step: 'animal', animalId: animal.id })}
                          className={`w-full rounded-2xl border border-[#d0e7cf] bg-[#f2fff4] p-4 text-left shadow-sm transition ${
                            !cameraEnabled || !enclosureCaptured || animalCaptured
                              ? 'cursor-not-allowed opacity-60'
                              : 'hover:-translate-y-0.5 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#0d5c3a]">
                            <span>Étape 2 · Animal</span>
                            {animalCaptured ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          </div>
                          <p className="mt-2 text-xs text-[#1f3b2a]">
                            {enclosureCaptured
                              ? 'Capture l’animal pour compléter cette rencontre.'
                              : 'Étape verrouillée tant que le panneau n’est pas scanné.'}
                          </p>
                          <div className="mt-3 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-[#103622]">
                            {!enclosureCaptured
                              ? 'Panneau requis'
                              : animalCaptured
                              ? 'Déjà validé'
                              : cameraEnabled
                              ? 'Capturer cet animal'
                              : 'Caméra désactivée'}
                          </div>
                        </button>
                      </div>
                      {!cameraEnabled && (
                        <div className="flex items-center gap-2 rounded-xl bg-[#fef1f1] px-3 py-2 text-xs text-[#983737]">
                          <Lock className="h-3.5 w-3.5" />
                          Caméra désactivée dans les paramètres.
                        </div>
                      )}
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
