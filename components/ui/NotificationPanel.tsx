'use client';

import { ZooNotification } from '@/app/types/zoo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Info, TriangleAlert } from 'lucide-react';

interface NotificationPanelProps {
  notifications: ZooNotification[];
  open: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const typeConfig: Record<ZooNotification['type'], { label: string; icon: JSX.Element; className: string }> = {
  event: { label: 'Événement', icon: <Bell className="size-4" />, className: 'bg-blue-50 text-blue-600' },
  alert: { label: 'Alerte', icon: <TriangleAlert className="size-4" />, className: 'bg-red-50 text-red-600' },
  info: { label: 'Info', icon: <Info className="size-4" />, className: 'bg-amber-50 text-amber-600' },
};

export function NotificationPanel({
  notifications,
  open,
  onClose,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Centre de notifications</DialogTitle>
          <DialogDescription>
            {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} en attente` : 'Tout est à jour'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={onMarkAllRead} disabled={unreadCount === 0}>
            Tout marquer comme lu
          </Button>
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type];
            return (
              <div
                key={notification.id}
                className={`rounded-lg border px-4 py-3 ${notification.unread ? 'border-blue-200 bg-white' : 'border-gray-100 bg-gray-50'}`}
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
                <div className="mt-3 flex items-center justify-between">
                  <Badge className={notification.unread ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}>
                    {notification.unread ? 'Non lu' : 'Lu'}
                  </Badge>
                  {notification.unread && (
                    <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)}>
                      Marquer comme lu
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {notifications.length === 0 && (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-gray-500">
              Aucune notification pour le moment.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
