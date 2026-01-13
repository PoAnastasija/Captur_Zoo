import { Animal } from '../types/zoo';
import { pois } from './pois';

// Extract all animals from POIs
const animalPois = pois.filter((poi) => poi.category === 'animals');

// Create detailed test animals from the first 3 POIs
const testAnimalsData = [
  {
    id: animalPois[0]?.id || 'cercopitheques',
    name: animalPois[0]?.name || 'Cercopithèques',
    species: 'Cercopithecus spp.',
    description:
      'Les cercopithèques sont des singes africains caractérisés par leurs visages expressifs et leurs couleurs variées. Ils vivent en groupes sociaux complexes dans les forêts tropicales.',
    funFact:
      'Les cercopithèques communiquent entre eux par plus de 30 sons différents, chacun ayant une signification spécifique!',
    conservationStatus: 'LC' as const,
    imageUrl: animalPois[0]?.imageUrl,
  },
  {
    id: animalPois[1]?.id || 'loups-a-criniere',
    name: animalPois[1]?.name || 'Loups à crinière',
    species: 'Chrysocyon brachyurus',
    description:
      'Le loup à crinière est le plus grand canidé sauvage d\'Amérique du Sud. Malgré son nom, ce n\'est pas un vrai loup mais plutôt un animal unique dans son genre.',
    funFact: 'Le loup à crinière peut atteindre 1,40 m de hauteur aux épaules, principalement grâce à ses longues pattes!',
    conservationStatus: 'VU' as const,
    imageUrl: animalPois[1]?.imageUrl,
  },
  {
    id: animalPois[2]?.id || 'ours-polaires',
    name: animalPois[2]?.name || 'Ours polaires',
    species: 'Ursus maritimus',
    description:
      'L\'ours polaire est le plus grand carnivore terrestre. Parfaitement adapté à l\'Arctique, il possède une fourrure isolante et une épaisse couche de graisse.',
    funFact: 'La fourrure de l\'ours polaire n\'est pas blanche mais transparente, et sa peau est noire pour absorber la chaleur!',
    conservationStatus: 'VU' as const,
    imageUrl: animalPois[2]?.imageUrl,
  },
];

export const baseAnimals: Animal[] = testAnimalsData
  .filter((animal) => animal.imageUrl) // Only include animals with images
  .map((animal) => ({
    id: animal.id,
    name: animal.name,
    species: animal.species,
    category: 'mammal' as const,
    zoneName: animal.name,
    position: [47.7336, 7.3478], // Default zoo position
    image: animal.imageUrl || 'https://via.placeholder.com/400?text=Image+non+disponible',
    description: animal.description,
    funFact: animal.funFact,
    conservationStatus: animal.conservationStatus,
    feedingTimes: ['10:00', '15:00'],
    capacity: 80,
    visitorCount: 50,
    crowdLevel: 'moderate' as const,
    enclosure: {
      name: animal.name,
      position: [47.7336, 7.3478],
      radius: 20,
    },
  }));
