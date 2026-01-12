"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ShopPanelProps {
  open: boolean;
  onClose: () => void;
  onOpenCrowdReport: () => void;
  onOpenNotifications: () => void;
}

const shopItems = [
  {
    id: 'plush-panda',
    title: 'Peluche panda géant',
    subtitle: 'Edition limitée déco capsule',
    price: '29,90 €',
    tag: 'Nouveau',
    tagTone: 'bg-rose-100 text-rose-700',
  },
  {
    id: 'augmented-passport',
    title: 'Passeport photo AR',
    subtitle: 'Défis additionnels + stickers exclusifs',
    price: '12,00 €',
    tag: 'Best-seller',
    tagTone: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'family-pack',
    title: 'Pack famille 4 boissons',
    subtitle: 'Dispo aux kiosques Panoramas & Savane',
    price: '15,50 €',
    tag: '-10%',
    tagTone: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'night-safari',
    title: 'Safari photo de nuit',
    subtitle: 'Créneau guidé 21h30 · 12 places',
    price: '45,00 €',
    tag: 'Expérience',
    tagTone: 'bg-indigo-100 text-indigo-700',
  },
];

export function ShopPanel({ open, onClose, onOpenCrowdReport, onOpenNotifications }: ShopPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-white p-0"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <DialogTitle className="text-2xl font-bold">Boutique & services</DialogTitle>
              <DialogDescription>
                Prépare ta visite avec les indispensables et déclenche les services utiles en un geste.
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
            <div className="grid gap-4 sm:grid-cols-2">
              {shopItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.subtitle}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.tagTone}`}>
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-bold text-gray-900">{item.price}</p>
                  <Button variant="secondary" className="mt-4 w-full">
                    Précommander
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-800 transition hover:border-emerald-300"
                onClick={onOpenCrowdReport}
              >
                Signaler une zone d'affluence
              </button>
              <button
                type="button"
                className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm font-semibold text-sky-800 transition hover:border-sky-300"
                onClick={onOpenNotifications}
              >
                Voir les actus et alertes
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
