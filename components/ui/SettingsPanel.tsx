"use client";

import { Navigation2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
  badge?: string;
}

const ToggleRow = ({ label, description, enabled, onToggle, disabled, badge }: ToggleProps) => {
  const handleClick = () => {
    if (disabled) {
      return;
    }
    onToggle(!enabled);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60',
        disabled && 'cursor-not-allowed opacity-70'
      )}
    >
      <div className="flex flex-col gap-1 pr-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold tracking-wide">{label}</p>
          {badge && (
            <span className="rounded-full border border-white/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em]">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-white/70">{description}</p>
      </div>
      <span
        className={cn(
          'relative inline-flex h-7 w-12 items-center rounded-full border border-white/30 transition',
          enabled ? 'bg-emerald-400/80' : 'bg-white/20'
        )}
        aria-hidden
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white transition',
            enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
          )}
        />
      </span>
    </button>
  );
};

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onReturnToMap: () => void;
  locationEnabled: boolean;
  onToggleLocation: (next: boolean) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (next: boolean) => void;
  notificationPermission: NotificationPermission;
  cameraEnabled: boolean;
  onToggleCamera: (next: boolean) => void;
}

export function SettingsPanel({
  open,
  onClose,
  onReturnToMap,
  locationEnabled,
  onToggleLocation,
  notificationsEnabled,
  onToggleNotifications,
  notificationPermission,
  cameraEnabled,
  onToggleCamera,
}: SettingsPanelProps) {
  const notifDisabled = notificationPermission === 'denied';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-screen max-h-screen w-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-gradient-to-b from-[#0d4f4a] to-[#07332d] px-0 py-0 text-white"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
            <div>
              <DialogTitle className="text-2xl font-semibold">Paramètres</DialogTitle>
              <DialogDescription className="text-white/70">
                Active ou désactive les fonctionnalités sensibles à la localisation, aux notifications et à la caméra.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onReturnToMap}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10"
            >
              <Navigation2 className="h-4 w-4" /> Retour carte
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
            <ToggleRow
              label="Localisation"
              description={locationEnabled ? 'La carte suit ta position dans le parc.' : 'Les services de localisation sont coupés.'}
              enabled={locationEnabled}
              onToggle={onToggleLocation}
            />
            <ToggleRow
              label="Notifications de proximité"
              description={
                notifDisabled
                  ? 'Accès refusé dans le système. Active-les dans les réglages pour continuer.'
                  : notificationsEnabled
                  ? 'Alertes en direct lorsqu’un événement se déclenche près de toi.'
                  : 'Aucune alerte ne sera envoyée.'
              }
              badge={notificationPermission === 'default' ? 'Demande' : undefined}
              enabled={notificationsEnabled}
              onToggle={onToggleNotifications}
              disabled={notifDisabled}
            />
            <ToggleRow
              label="Caméra & captures"
              description={cameraEnabled ? 'Autorise les quêtes photos et les scans d’animaux.' : 'Les boutons de capture resteront gris.'}
              enabled={cameraEnabled}
              onToggle={onToggleCamera}
            />
          </div>
          <div className="border-t border-white/10 px-5 py-4 text-xs text-white/60">
            Les réglages sont stockés localement sur cet appareil.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
