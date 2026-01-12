import { PhotoQuest } from '../types/zoo';

export const photoQuests: PhotoQuest[] = [
  {
    id: 'starter-trio',
    title: 'Starter Safari',
    description: 'Capture les trois stars emblématiques de l\'entrée du zoo.',
    targets: ['1', '2', '3'],
    reward: '+150 XP & 1 badge',
    icon: '🌅',
  },
  {
    id: 'forest-echo',
    title: 'Écho de la forêt',
    description: 'Immortalise les espèces arboricoles avant le coucher du soleil.',
    targets: ['3', '4', '5'],
    reward: '+200 XP & carte souvenir',
    icon: '🌲',
  },
  {
    id: 'big-cats',
    title: 'Chuchotis Félins',
    description: 'Photographie les prédateurs silencieux sans les déranger.',
    targets: ['2'],
    reward: '+80 XP boost',
    icon: '🐾',
  },
];
