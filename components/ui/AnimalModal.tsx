'use client';

import { Animal } from '@/types/zoo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface AnimalModalProps {
  animal: Animal | null;
  open: boolean;
  onClose: () => void;
}

const conservationStatusLabels = {
  LC: { label: 'Préoccupation mineure', color: 'bg-green-500' },
  NT: { label: 'Quasi menacé', color: 'bg-yellow-500' },
  VU: { label: 'Vulnérable', color: 'bg-orange-500' },
  EN: { label: 'En danger', color: 'bg-red-500' },
  CR: { label: 'En danger critique', color: 'bg-red-700' },
};

export default function AnimalModal({ animal, open, onClose }: AnimalModalProps) {
  if (!animal) return null;

  const status = conservationStatusLabels[animal.conservationStatus];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{animal.name}</DialogTitle>
          <DialogDescription className="italic">{animal.species}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={animal.image}
              alt={animal.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Statut de conservation */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Statut de conservation :</span>
            <Badge className={`${status.color} text-white`}>
              {status.label}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">À propos</h3>
            <p className="text-gray-700">{animal.description}</p>
          </div>

          {/* Fun Fact */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-900">💡 Le saviez-vous ?</h3>
            <p className="text-blue-800">{animal.funFact}</p>
          </div>

          {/* Horaires de nourrissage */}
          {animal.feedingTimes && animal.feedingTimes.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-900">🍽️ Horaires de nourrissage</h3>
              <div className="flex gap-2">
                {animal.feedingTimes.map((time, index) => (
                  <Badge key={index} variant="outline" className="bg-white">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}