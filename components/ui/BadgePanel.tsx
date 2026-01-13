'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { Animal, BadgeReward, CapturedPhoto, CaptureStep } from '@/app/types/zoo';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface ZoodexPanelProps {
  badges: BadgeReward[];
  animals: Animal[];
  capturedAnimals: string[];
  capturedEnclosures: string[];
  photos: CapturedPhoto[];
  open: boolean;
  onClose: () => void;
  onToggleBadge: (badgeId: string, shouldUnlock: boolean) => void;
}

const statusLabel = (unlocked: boolean) => (unlocked ? 'Débloqué' : 'En cours');
const stepLabelMap: Record<CaptureStep, string> = {
  enclosure: 'Panneau',
  animal: 'Animal',
};

const stepColorMap: Record<CaptureStep, { bg: string; text: string }> = {
  enclosure: { bg: 'bg-[#fff5e1]', text: 'text-[#8a4b12]' },
  animal: { bg: 'bg-[#e1f6d9]', text: 'text-[#1d6432]' },
};

export function ZoodexPanel({
  badges,
  animals,
  capturedAnimals,
  capturedEnclosures,
  photos,
  open,
  onClose,
  onToggleBadge,
}: ZoodexPanelProps) {
  const uniqueAnimals = useMemo(
    () => Array.from(new Map(animals.map((animal) => [animal.id, animal])).values()),
    [animals]
  );
  const animalMap = useMemo(() => new Map(uniqueAnimals.map((animal) => [animal.id, animal])), [uniqueAnimals]);
  const enclosureSet = useMemo(() => new Set(capturedEnclosures), [capturedEnclosures]);
  const animalSet = useMemo(() => new Set(capturedAnimals), [capturedAnimals]);
  const totalAnimals = uniqueAnimals.length;
  const enclosureCompletion = totalAnimals ? Math.round((enclosureSet.size / totalAnimals) * 100) : 0;
  const animalCompletion = totalAnimals ? Math.round((animalSet.size / totalAnimals) * 100) : 0;
  const photosByAnimal = useMemo(() => {
    const map = new Map<string, CapturedPhoto[]>();
    photos.forEach((photo) => {
      const bucket = map.get(photo.animalId) ?? [];
      bucket.push(photo);
      map.set(photo.animalId, bucket);
    });
    return map;
  }, [photos]);
  const latestPhotos = photos.slice(0, 9);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-screen max-h-screen w-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-gradient-to-b from-[#fdf5e3] via-[#fbedd2] to-[#f9e1b7] p-0"
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/40 px-4 py-4 sm:px-6">
            <div>
              <DialogTitle className="text-3xl font-bold text-[#1f2a24]">Zoodex vivant</DialogTitle>
              <DialogDescription className="text-[#4a5a51]">
                Suis tes badges et tes rencontres photo comme dans un Pokédex, mais version zoologique.
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
            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-[0_12px_30px_rgba(20,54,45,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#a56c2f]">Panneaux scannés</p>
                <p className="mt-2 text-4xl font-bold text-[#1d2c27]">{enclosureSet.size}</p>
                <p className="text-xs text-[#5a4b3a]">{enclosureCompletion}% de la collection</p>
              </div>
              <div className="rounded-3xl border border-white/60 bg-[#0d4f4a] p-4 text-white shadow-[0_12px_30px_rgba(13,79,74,0.25)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">Animaux capturés</p>
                <p className="mt-2 text-4xl font-bold">{animalSet.size}</p>
                <p className="text-xs text-white/80">{animalCompletion}% valides</p>
              </div>
            </section>

            <section className="mt-6 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#a56c2f]">Encyclopédie vivante</h2>
              <div className="grid gap-3 xl:grid-cols-2">
                {uniqueAnimals.map((animal) => {
                  const enclosureCaptured = enclosureSet.has(animal.id);
                  const animalCaptured = animalSet.has(animal.id);
                  const animalPhotos = photosByAnimal.get(animal.id) ?? [];
                  return (
                    <div
                      key={animal.id}
                      className="flex gap-4 rounded-3xl border border-[#eedbc1] bg-white/85 p-3 shadow-sm"
                    >
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl">
                        <Image
                          src={animal.image}
                          alt={animal.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#1f2a24]">{animal.name}</p>
                          <p className="text-xs text-[#6b5a46]">{animal.zoneName}</p>
                          <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wide">
                            {animal.species}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                              enclosureCaptured ? 'bg-[#e1f6d9] text-[#1d6432]' : 'bg-[#fff1d9] text-[#8a4b12]'
                            }`}
                          >
                            {enclosureCaptured ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                            Panneau
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                              animalCaptured ? 'bg-[#e1f6d9] text-[#1d6432]' : 'bg-[#fff1d9] text-[#8a4b12]'
                            }`}
                          >
                            {animalCaptured ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                            Animal
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6b5a46]">
                          {enclosureCaptured && animalCaptured
                            ? 'Rencontre complète!'
                            : enclosureCaptured
                            ? 'Encore un cliché de l’animal pour valider.'
                            : 'Commence par scanner le panneau depuis la galerie.'}
                        </div>
                        {animalPhotos.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pt-2">
                            {animalPhotos.slice(0, 3).map((photo) => (
                              <div key={photo.id} className="relative h-14 w-16 overflow-hidden rounded-xl border border-[#f2e5ce]">
                                <img src={photo.dataUrl} alt="Capture Zoodex" className="h-full w-full object-cover" />
                                <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1 text-[9px] font-semibold uppercase text-white">
                                  {photo.step === 'enclosure' ? 'P' : 'A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#a56c2f]">Album photo partagé</h2>
              {latestPhotos.length === 0 ? (
                <p className="text-xs text-[#6b5a46]">Aucune capture pour l’instant. Utilise la galerie pour ajouter tes clichés.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {latestPhotos.map((photo) => {
                    const meta = animalMap.get(photo.animalId);
                    const colors = stepColorMap[photo.step];
                    return (
                      <div key={photo.id} className="overflow-hidden rounded-3xl border border-[#eedbc1] bg-white/85 shadow-sm">
                        <div className="relative h-40 w-full">
                          <img src={photo.dataUrl} alt={meta ? meta.name : 'Capture Zoodex'} className="h-full w-full object-cover" />
                          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                            {stepLabelMap[photo.step]}
                          </span>
                        </div>
                        <div className="px-4 py-3 text-sm text-[#4a5a51]">
                          <p className="font-semibold text-[#1f2a24]">{meta ? meta.name : 'Animal inconnu'}</p>
                          <p className="text-xs text-[#6b5a46]">{formatDate(photo.takenAt)}</p>
                          <a
                            href={photo.dataUrl}
                            download={photo.filename}
                            className="mt-2 inline-flex text-[11px] font-semibold uppercase tracking-wide text-[#0d4f4a] hover:underline"
                          >
                            Télécharger
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-8 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#0d4f4a]">Badges & trophées</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {badges.map((badge) => (
                  <Card
                    key={badge.id}
                    className={`border ${badge.unlocked ? 'border-[#0d4f4a] bg-[#0d4f4a]/5' : 'border-[#eadbc2]'}`}
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" aria-hidden>
                          {badge.icon}
                        </span>
                        <div>
                          <p className="text-base font-semibold text-[#1f2a24]">{badge.title}</p>
                          <p className="text-xs text-[#6f5d48]">{badge.requirement}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#4a5a51]">{badge.description}</p>
                      {typeof badge.progress === 'number' && !badge.unlocked && (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-[#6b5a46]">
                            <span>Progression</span>
                            <span>{Math.round(badge.progress * 100)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#f3eadc]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0d4f4a] to-[#7fba39]"
                              style={{ width: `${Math.min(100, Math.max(0, badge.progress * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <Badge className={badge.unlocked ? 'bg-[#7fba39] text-white' : 'bg-[#f7efe1] text-[#876f3c]'}>
                        {statusLabel(badge.unlocked)}
                      </Badge>
                      <div className="flex flex-wrap gap-2 text-xs text-[#6f5d48]">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => onToggleBadge(badge.id, true)}
                          className="h-8 px-3 text-xs"
                        >
                          Débloquer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={() => onToggleBadge(badge.id, false)}
                          className="h-8 px-3 text-xs"
                        >
                          Réinitialiser
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
