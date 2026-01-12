import { BadgeReward } from '../types/zoo';

export const baseBadges: BadgeReward[] = [
  {
    id: 'navigator',
    title: 'Explorateur Local',
    description: 'Active la géolocalisation pour te situer sur le plan.',
    requirement: 'Autoriser la localisation',
    unlocked: false,
    progress: 0,
    icon: '🧭',
  },
  {
    id: 'guardian',
    title: 'Gardien Express',
    description: 'Vérifie les zones sous haute affluence et aide à les fluidifier.',
    requirement: 'Consulter les alertes d\'affluence',
    unlocked: false,
    progress: 0.5,
    icon: '🛟',
  },
  {
    id: 'collector',
    title: 'Collectionneur',
    description: 'Découvre les fiches de plusieurs animaux différents.',
    requirement: 'Ouvrir 3 fiches animaux',
    unlocked: false,
    progress: 0.33,
    icon: '📸',
  },
  {
    id: 'insider',
    title: 'VIP du Zoo',
    description: 'Reste informé de tous les événements clés du zoo.',
    requirement: 'Lire 5 notifications',
    unlocked: false,
    progress: 0.6,
    icon: '✨',
  },
];
