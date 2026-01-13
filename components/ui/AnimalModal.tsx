'use client';

import Image from 'next/image';
import { MapPin, Users, Sparkles, Camera, Activity } from 'lucide-react';
import { Animal } from '@/types/zoo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AnimalModalProps {
  animal: Animal | null;
  open: boolean;
  onClose: () => void;
  onRequestCapture?: () => void;
}

const categoryLabels: Record<Animal['category'], string> = {
  mammal: 'Mammifère',
  bird: 'Oiseau',
  reptile: 'Reptile',
  amphibian: 'Amphibien',
};

const crowdMeta = {
  low: { label: 'Affluence fluide', badge: 'bg-emerald-100 text-emerald-800' },
  moderate: { label: 'Affluence modérée', badge: 'bg-amber-100 text-amber-800' },
  high: { label: 'Affluence élevée', badge: 'bg-rose-100 text-rose-800' },
};

const conservationMeta: Record<Animal['conservationStatus'], { label: string; color: string }> = {
  LC: { label: 'Préoccupation mineure', color: 'bg-emerald-600' },
  NT: { label: 'Quasi menacé', color: 'bg-lime-600' },
  VU: { label: 'Vulnérable', color: 'bg-amber-600' },
  EN: { label: 'En danger', color: 'bg-orange-600' },
  CR: { label: 'En danger critique', color: 'bg-rose-600' },
};

export default function AnimalModal({ animal, open, onClose, onRequestCapture }: AnimalModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleCaptureClick = () => {
    if (!onRequestCapture) {
      return;
    }
    onRequestCapture();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border-0 p-0 shadow-2xl">
        {animal ? (
          <div className="flex flex-col">
            <div className="relative h-56 w-full sm:h-64">
              <Image
                src={animal.image}
                alt={animal.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 text-white">
                <Badge className="bg-white/20 text-white backdrop-blur-md">
                  {categoryLabels[animal.category]}
                </Badge>
                <Badge className={`${crowdMeta[animal.crowdLevel].badge} backdrop-blur-md`}>
                  {crowdMeta[animal.crowdLevel].label}
                </Badge>
              </div>
              <div className="absolute bottom-4 left-4 text-white drop-shadow">
                <p className="text-sm uppercase tracking-wide text-white/80">{animal.zoneName}</p>
                <h2 className="text-3xl font-bold">{animal.name}</h2>
                <p className="text-sm text-white/90">{animal.species}</p>
              </div>
            </div>

            <DialogHeader className="px-6 pt-6 text-left">
              <DialogTitle className="text-2xl font-bold text-gray-900">Explorer {animal.name}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Découvre les secrets de ce résident et prépare ton meilleur cliché.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 px-6 pt-4 pb-6 sm:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  Zone & affluence
                </div>
                <p className="text-sm text-gray-600">{animal.zoneName}</p>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {crowdMeta[animal.crowdLevel].label} · {animal.visitorCount}/{animal.capacity} visiteurs
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Users className="h-4 w-4 text-sky-500" />
                  Statut & nutrition
                </div>
                <Badge className={`${conservationMeta[animal.conservationStatus].color} text-white`}>
                  {conservationMeta[animal.conservationStatus].label}
                </Badge>
                {animal.feedingTimes && animal.feedingTimes.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Heures de nourrissage</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm">
                      {animal.feedingTimes.map((time) => (
                        <span key={time} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Camera className="h-4 w-4 text-rose-500" />
                  Enclos connecté
                </div>
                <p className="text-sm text-gray-600">{animal.enclosure.name}</p>
                <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-900">
                  Rayon de {animal.enclosure.radius} m · Approche l'entrée officielle puis scanne le panneau pour déclencher la capture.
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:col-span-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  À connaître
                </div>
                <p className="text-sm text-gray-700">{animal.description}</p>
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <Sparkles className="mb-1 h-4 w-4" />
                  <p className="font-semibold">Fun fact</p>
                  <p className="text-emerald-800">{animal.funFact}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Capture un souvenir AR près de la zone {animal.zoneName} en deux étapes : panneau puis animal.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Fermer
                </Button>
                <Button className="gap-2" onClick={handleCaptureClick} disabled={!onRequestCapture}>
                  <Camera className="h-4 w-4" />
                  Scanner ce résident
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">
            Sélectionne un résident sur la carte pour afficher ses informations.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
