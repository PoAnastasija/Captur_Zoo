'use client';

import { BadgeReward } from '@/app/types/zoo';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BadgePanelProps {
  badges: BadgeReward[];
  open: boolean;
  onClose: () => void;
}

const statusLabel = (unlocked: boolean) => (unlocked ? 'Débloqué' : 'En cours');

export function BadgePanel({ badges, open, onClose }: BadgePanelProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-white p-0"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <DialogTitle className="text-2xl font-bold">Centre des badges</DialogTitle>
              <p className="text-sm text-gray-500">Suis tes trophées et bonus débloqués.</p>
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
            <div className="grid gap-4 md:grid-cols-2">
              {badges.map((badge) => (
                <Card key={badge.id} className={`border ${badge.unlocked ? 'border-blue-500' : 'border-gray-200'}`}>
                  <CardHeader className="flex-row items-center gap-3">
                    <div className="text-3xl" aria-hidden>
                      {badge.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{badge.title}</CardTitle>
                      <p className="text-sm text-gray-500">{badge.requirement}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{badge.description}</p>
                    {typeof badge.progress === 'number' && !badge.unlocked && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progression</span>
                          <span>{Math.round(badge.progress * 100)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.min(100, Math.max(0, badge.progress * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <Badge className={badge.unlocked ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}>
                      {statusLabel(badge.unlocked)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
