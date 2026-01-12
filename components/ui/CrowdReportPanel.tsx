'use client';

import { useMemo, useState } from 'react';
import { Animal, CrowdLevel } from '@/types/zoo';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CrowdReportPanelProps {
  animals: Animal[];
  open: boolean;
  onClose: () => void;
  onReport: (payload: { animalId: string; level: CrowdLevel; comment: string }) => void;
}

const levelOptions: { value: CrowdLevel; label: string; helper: string }[] = [
  { value: 'low', label: 'Fluide', helper: 'Moins de 50% de la capacité' },
  { value: 'moderate', label: 'Soutenue', helper: 'Entre 50% et 80%' },
  { value: 'high', label: 'Saturée', helper: 'Plus de 80%' },
];

export function CrowdReportPanel({ animals, open, onClose, onReport }: CrowdReportPanelProps) {
  const [animalId, setAnimalId] = useState('');
  const [level, setLevel] = useState<CrowdLevel>('moderate');
  const [comment, setComment] = useState('');

  const resolvedAnimalId = useMemo(() => {
    if (animalId && animals.some((animal) => animal.id === animalId)) {
      return animalId;
    }
    return animals[0]?.id ?? '';
  }, [animalId, animals]);

  const selectedAnimal = useMemo(
    () => animals.find((animal) => animal.id === resolvedAnimalId),
    [animals, resolvedAnimalId]
  );

  const resetForm = () => {
    setAnimalId('');
    setLevel('moderate');
    setComment('');
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolvedAnimalId) return;
    onReport({ animalId: resolvedAnimalId, level, comment: comment.trim() });
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-white p-0"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <DialogTitle className="text-2xl font-bold">Signaler l&rsquo;affluence</DialogTitle>
              <DialogDescription>
                Partage ta perception en temps réel pour aider les autres visiteurs.
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
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="zone-select">
                  Zone concernée
                </label>
                <select
                  id="zone-select"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={resolvedAnimalId}
                  onChange={(event) => setAnimalId(event.target.value)}
                >
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.zoneName} · {animal.name}
                    </option>
                  ))}
                </select>
                {selectedAnimal && (
                  <p className="text-xs text-gray-500">
                    Capacité {selectedAnimal.capacity} visiteurs · Affluence actuelle {selectedAnimal.visitorCount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Niveau d&rsquo;affluence observé</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {levelOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        level === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="crowd-level"
                        value={option.value}
                        checked={level === option.value}
                        onChange={() => setLevel(option.value)}
                        className="sr-only"
                      />
                      <p>{option.label}</p>
                      <p className="text-[10px] font-normal text-gray-500">{option.helper}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="comment">
                  Commentaire (optionnel)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Exemple : File d&rsquo;attente dense côté passerelle."
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>

              {selectedAnimal && (
                <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  <p>Affluence officielle : {selectedAnimal.visitorCount}/{selectedAnimal.capacity} visiteurs</p>
                  <p>Ta contribution sera visible immédiatement par les autres visiteurs.</p>
                </div>
              )}

              <DialogFooter className="flex flex-col gap-3 border-t border-dashed border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Badge className="bg-blue-600 text-white">Mode collaboratif actif</Badge>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={!resolvedAnimalId}>
                    Envoyer le signalement
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
