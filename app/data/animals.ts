import { Animal } from '../types/zoo';

// Coordonnées approximatives du Zoo de Mulhouse
// Centre : 47.7315751, 7.347215

export const animals: Animal[] = [
  {
    id: '1',
    name: 'Ours Polaire',
    species: 'Ursus maritimus',
    category: 'mammal',
    position: [47.7320, 7.3475], // Position approximative
    image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=500',
    description: 'Les ours polaires sont les plus grands carnivores terrestres.',
    funFact: 'Un ours polaire peut nager pendant plusieurs jours sans s\'arrêter !',
    conservationStatus: 'VU',
    feedingTimes: ['11:00', '16:00']
  },
  {
    id: '2',
    name: 'Tigre de Sibérie',
    species: 'Panthera tigris altaica',
    category: 'mammal',
    position: [47.7318, 7.3468],
    image: 'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?w=500',
    description: 'Le tigre de Sibérie est le plus grand félin du monde.',
    funFact: 'Chaque tigre a un motif de rayures unique, comme une empreinte digitale.',
    conservationStatus: 'EN',
    feedingTimes: ['10:30', '15:30']
  },
  {
    id: '3',
    name: 'Panda Roux',
    species: 'Ailurus fulgens',
    category: 'mammal',
    position: [47.7312, 7.3470],
    image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=500',
    description: 'Malgré son nom, le panda roux n\'est pas un ours mais proche des ratons laveurs.',
    funFact: 'Les pandas roux passent 13 heures par jour à manger du bambou !',
    conservationStatus: 'EN',
    feedingTimes: ['09:30', '14:30']
  },
  {
    id: '4',
    name: 'Gibbon à Favoris Blancs',
    species: 'Nomascus leucogenys',
    category: 'mammal',
    position: [47.7316, 7.3478],
    image: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=500',
    description: 'Les gibbons sont connus pour leurs chants mélodieux au petit matin.',
    funFact: 'Les gibbons peuvent sauter jusqu\'à 15 mètres de branche en branche !',
    conservationStatus: 'CR',
    feedingTimes: ['10:00', '15:00']
  },
  {
    id: '5',
    name: 'Lémuriens',
    species: 'Lemur catta',
    category: 'mammal',
    position: [47.7314, 7.3472],
    image: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=500',
    description: 'Les lémuriens sont endémiques de Madagascar.',
    funFact: 'Ils se servent de leur queue annelée comme drapeau pour communiquer !',
    conservationStatus: 'EN',
    feedingTimes: ['11:30', '16:30']
  }
];