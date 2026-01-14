import { PhotoQuest } from '../types/zoo';

export const photoQuests: PhotoQuest[] = [
  {
    id: 'savane-panorama',
    title: 'Panorama sahélien',
    description: 'Photographie les girafes, les addax et les flamants depuis les promontoires officiels.',
    targets: ['girafes-kordofan', 'addax-dunes', 'flamants-bernaches'],
    reward: '+150 XP & sticker exclusif',
    icon: '🌅',
  },
  {
    id: 'himalaya-radar',
    title: 'Radar des cimes',
    description: 'Capture le takin puis file vers la volière tropicale pour suivre la route du climat.',
    targets: ['takins-himalaya', 'motmot-houtouc', 'faux-gavial'],
    reward: '+220 XP & carte météo AR',
    icon: '🏔️',
  },
  {
    id: 'vigie-vosgienne',
    title: 'Vigie vosgienne',
    description: 'Suis les traces du lynx et note les observations partagées via le centre scientifique.',
    targets: ['lynx-boreal'],
    reward: '+80 XP & boost affluence',
    icon: '🐾',
  },
];
