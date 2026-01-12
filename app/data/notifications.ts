import { ZooNotification } from '../types/zoo';

export const baseNotifications: ZooNotification[] = [
  {
    id: 'notif-1',
    title: 'Nourrissage des pandas roux',
    body: 'Rendez-vous à la Bambouseraie à 14h30 pour assister au nourrissage.',
    type: 'event',
    timestamp: new Date().toISOString(),
    unread: true,
    location: {
      coords: [47.7324, 7.3487],
      radiusMeters: 140,
    },
  },
  {
    id: 'notif-2',
    title: 'Travaux près de la volière',
    body: 'Le passage à proximité de la grande volière est momentanément fermé.',
    type: 'alert',
    timestamp: new Date().toISOString(),
    unread: true,
    location: {
      coords: [47.7332, 7.3461],
      radiusMeters: 120,
    },
  },
  {
    id: 'notif-3',
    title: 'Atelier pédagogie',
    body: 'Participez à l\'atelier "Gardien d\'un jour" à 16h00 près du vivarium.',
    type: 'info',
    timestamp: new Date().toISOString(),
    unread: false,
    location: {
      coords: [47.7318, 7.3509],
      radiusMeters: 160,
    },
  },
];
