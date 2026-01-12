import { ZooNotification } from '../types/zoo';

export const baseNotifications: ZooNotification[] = [
  {
    id: 'notif-girafe-feeding',
    title: 'Briefing girafes en public',
    body: 'Les soigneurs commentent le nourrissage des girafes du Kordofan à 15h30 depuis la passerelle panoramique.',
    type: 'event',
    timestamp: '2025-01-11T14:45:00+01:00',
    unread: true,
    location: {
      coords: [47.7352192895607, 7.35063436974605],
      radiusMeters: 150,
    },
  },
  {
    id: 'notif-lynx-quiet',
    title: 'Silence demandé – Lynx',
    body: 'Merci de chuchoter sur la passerelle de la forêt rhénane : un suivi vétérinaire est en cours derrière les vitres.',
    type: 'alert',
    timestamp: '2025-01-11T13:20:00+01:00',
    unread: true,
    location: {
      coords: [47.7333645455023, 7.35096925552375],
      radiusMeters: 120,
    },
  },
  {
    id: 'notif-takin-talk',
    title: 'Rencontre autour des takins',
    body: 'L\'équipe Himalaya présente le suivi climatique des takins du Sichuan à 17h15, devant la terrasse supérieure.',
    type: 'info',
    timestamp: '2025-01-11T12:05:00+01:00',
    unread: false,
    location: {
      coords: [47.7357854859925, 7.35346212425944],
      radiusMeters: 160,
    },
  },
  {
    id: 'notif-vivier-travaux',
    title: 'Chemin latéral fermé',
    body: 'Le petit sentier longeant le terrarium tropical reste fermé jusqu\'à 18h pour l\'inspection des brumisateurs.',
    type: 'alert',
    timestamp: '2025-01-11T09:10:00+01:00',
    unread: false,
    location: {
      coords: [47.7354, 7.3520],
      radiusMeters: 110,
    },
  },
];
