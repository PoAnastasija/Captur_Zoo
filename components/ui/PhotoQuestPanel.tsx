'use client';

import { useMemo } from 'react';
import { Animal, PhotoQuest } from '@/types/zoo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface QuestWithProgress extends PhotoQuest {
  progress: number;
  completed: boolean;
}

interface PhotoQuestPanelProps {
  quests: QuestWithProgress[];
  animals: Animal[];
  capturedIds: string[];
  open: boolean;
  onClose: () => void;
}

export function PhotoQuestPanel({ quests, animals, capturedIds, open, onClose }: PhotoQuestPanelProps) {
  const animalMap = useMemo(() => new Map(animals.map((animal) => [animal.id, animal])), [animals]);
  const capturedSet = useMemo(() => new Set(capturedIds), [capturedIds]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Objectifs photo AR</DialogTitle>
          <DialogDescription>
            Complète les missions façon Pokémon GO pour débloquer des récompenses exclusives.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {quests.map((quest) => {
            const progressPercent = Math.round(quest.progress * 100);
            return (
              <div
                key={quest.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  quest.completed ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {quest.icon}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{quest.title}</p>
                      <p className="text-sm text-gray-500">{quest.description}</p>
                    </div>
                  </div>
                  <Badge className={quest.completed ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-800'}>
                    {quest.completed ? 'Terminé' : `${progressPercent}%`}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-pink-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {quest.targets.map((targetId) => {
                      const animal = animalMap.get(targetId);
                      const isCaptured = capturedSet.has(targetId);
                      return (
                        <span
                          key={targetId}
                          className={`rounded-full px-3 py-1 font-medium ${
                            isCaptured ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {animal ? animal.name : 'Inconnu'}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Récompense : {quest.reward}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
