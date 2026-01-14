'use client';

import { CrowdLevel, CrowdReportEntry, ZooNotification } from '@/app/types/zoo';
import { ReactNode } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Info, TriangleAlert } from 'lucide-react';

interface NotificationPanelProps {
  notifications: ZooNotification[];
  crowdReports: CrowdReportEntry[];
  open: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const typeConfig: Record<ZooNotification['type'], { label: string; icon: ReactNode; className: string }> = {
  event: { label: 'Événement', icon: <Bell className="size-4" />, className: 'bg-blue-50 text-blue-600' },
  alert: { label: 'Alerte', icon: <TriangleAlert className="size-4" />, className: 'bg-red-50 text-red-600' },
  info: { label: 'Info', icon: <Info className="size-4" />, className: 'bg-amber-50 text-amber-600' },
};

const crowdLevelConfig: Record<CrowdLevel, { label: string; className: string }> = {
  low: { label: 'Fluide', className: 'bg-emerald-100 text-emerald-700' },
  moderate: { label: 'Soutenue', className: 'bg-amber-100 text-amber-700' },
  high: { label: 'Saturée', className: 'bg-red-100 text-red-700' },
};

export function NotificationPanel({
  notifications,
  crowdReports,
  open,
  onClose,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => n.unread).length;
  const latestCrowdReports = crowdReports.slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-white p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <DialogTitle className="text-2xl font-bold">Centre de notifications</DialogTitle>
              <DialogDescription>
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} en attente`
                  : 'Tout est à jour'}
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
          <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3">
            <Button variant="outline" size="sm" onClick={onMarkAllRead} disabled={unreadCount === 0}>
              Tout marquer comme lu
            </Button>
            <Badge variant="secondary" className="text-xs">
              {notifications.length} alertes totales
            </Badge>
          </div>
          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto px-6 py-6">
            {notifications.map((notification) => {
              const config = typeConfig[notification.type];
              return (
                <div
                  key={notification.id}
                  className={`rounded-lg border px-4 py-3 ${
                    notification.unread ? 'border-blue-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${config.className}`}>
                      {config.icon}
                      <span>{config.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600">{notification.body}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge className={notification.unread ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}>
                      {notification.unread ? 'Non lu' : 'Lu'}
                    </Badge>
                    <div className="flex gap-1">
                      {notification.unread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                        >
                          Marquer comme lu
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {notifications.length === 0 && (
              <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-gray-500">
                Aucune notification pour le moment.
              </div>
            )}
            {latestCrowdReports.length > 0 && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-indigo-700">
                  Signalements des visiteurs
                </p>
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                  {latestCrowdReports.map((report) => {
                    const levelMeta = crowdLevelConfig[report.level];
                    return (
                      <div key={report.id} className="rounded-xl bg-white/80 p-3 text-xs text-gray-600">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                          <span>
                            {new Date(report.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <Badge className={levelMeta.className}>{levelMeta.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{report.zoneName}</p>
                        <p className="text-sm text-gray-700">
                          {report.comment?.length ? report.comment : 'Affluence signalée sans commentaire.'}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                          {report.visitorCount} visiteurs observés · {report.contributor}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
