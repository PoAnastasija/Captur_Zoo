'use client';

import { Animal } from '@/app/types/zoo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CrowdPanelProps {
  animals: Animal[];
  onRefresh: () => void;
}

const crowdConfig = {
  low: { label: 'Faible', className: 'bg-emerald-100 text-emerald-800' },
  moderate: { label: 'Modérée', className: 'bg-amber-100 text-amber-800' },
  high: { label: 'Forte', className: 'bg-red-100 text-red-700' },
};

export function CrowdPanel({ animals, onRefresh }: CrowdPanelProps) {
  const sorted = [...animals].sort((a, b) => {
    const priority = { high: 0, moderate: 1, low: 2 };
    const diff = priority[a.crowdLevel] - priority[b.crowdLevel];
    if (diff !== 0) return diff;
    return b.visitorCount / b.capacity - a.visitorCount / a.capacity;
  });

  return (
    <Card className="w-full bg-white/95 backdrop-blur">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Affluence en direct</CardTitle>
          <p className="text-xs text-gray-500">Zones classées par priorité</p>
        </div>
        <Button variant="outline" size="icon-sm" onClick={onRefresh} aria-label="Rafraîchir">
          <RefreshCw className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.map((animal) => {
          const ratio = Math.min(1, animal.visitorCount / animal.capacity);
          const config = crowdConfig[animal.crowdLevel];
          return (
            <div key={animal.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{animal.zoneName}</p>
                  <p className="text-xs text-gray-500">{animal.name}</p>
                </div>
                <Badge className={`${config.className}`}>Affluence {config.label}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{animal.visitorCount} visiteurs</span>
                <span>Capacité {animal.capacity}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${
                    animal.crowdLevel === 'high'
                      ? 'bg-red-500'
                      : animal.crowdLevel === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
