import { Animal } from '../types/zoo';

const DEFAULT_FEEDING = ['10:00', '15:00'];
const DEFAULT_CAPACITY = 80;
const DEFAULT_VISITORS = 50;
const DEFAULT_RADIUS = 20;

const animalSeeds: Array<{
  id: string;
  name: string;
  species: string;
  description: string;
  funFact: string;
  conservationStatus: Animal['conservationStatus'];
  position: [number, number];
  image: string;
}> = [
  {
    id: 'cercopitheques',
    name: 'Cercopithèques',
    species: 'Cercopithecus spp.',
    description:
      'Les cercopithèques sont des singes africains caractérisés par leurs visages expressifs et leurs couleurs variées. Ils vivent en groupes sociaux complexes dans les forêts tropicales.',
    funFact:
      'Les cercopithèques communiquent entre eux par plus de 30 sons différents, chacun ayant une signification spécifique!',
    conservationStatus: 'LC',
    position: [47.7359161766421, 7.35098874264392],
    image: 'https://api.getwemap.com/images/pps-picpoints/d4516f31ea92d05975ace46e.39271519.jpg',
  },
  {
    id: 'loups-a-criniere',
    name: 'Loups à crinière',
    species: 'Chrysocyon brachyurus',
    description:
      "Le loup à crinière est le plus grand canidé sauvage d'Amérique du Sud. Malgré son nom, ce n'est pas un vrai loup mais plutôt un animal unique dans son genre.",
    funFact:
      'Le loup à crinière peut atteindre 1,40 m de hauteur aux épaules, principalement grâce à ses longues pattes!',
    conservationStatus: 'VU',
    position: [47.7359862276551, 7.34845876693106],
    image: 'https://api.getwemap.com/images/pps-picpoints/b11b449fdb646de5fec2dcb7.53486416.jpg',
  },
  {
    id: 'ours-polaires',
    name: 'Ours polaires',
    species: 'Ursus maritimus',
    description:
      "L'ours polaire (Ursus maritimus) est le plus grand carnivore terrestre, pouvant peser jusqu'à 650 kg. Contrairement aux autres ours, il possède un régime quasi exclusivement carné, chassant principalement les phoques annelés et barbus sur la banquise arctique.\nUn géant menacé\nClassé Vulnérable par l'UICN, il reste environ 26 000 ours polaires dans le monde. La principale menace est le réchauffement climatique qui provoque une fonte accélérée de la banquise, leur terrain de chasse. Les femelles peinent à constituer les réserves de graisse nécessaires à leur reproduction. À la naissance, un ourson ne pèse que 600 grammes et sera allaité pendant environ 2 ans.",
    funFact:
      'L\'engagement du zoo de Mulhouse\nLe Parc zoologique et botanique participe activement au Programme d\'Élevage Européen (EEP) qui coordonne 150 ours dans 50 institutions européennes. Deux enclos de 1000 m² avec bassins de 3 mètres permettent de séparer mâle et femelle lors des naissances, reproduisant leur comportement naturel.\nSuccès remarquables\nDeux naissances exceptionnelles ont marqué l\'histoire du zoo : Nanuq en 2016 et Kara en 2020, nées du couple Sesi et Vicks. Moins de 10 naissances ont lieu chaque année en Europe !\nPartenaire de Polar Bears International, le zoo préserve un patrimoine génétique précieux et sensibilise le public à la lutte contre le réchauffement climatique.\nPartenaire de Polar Bears International, le zoo préserve un patrimoine génétique précieux et sensibilise le public à la lutte contre le réchauffement climatique.',
    conservationStatus: 'VU',
    position: [47.7325722919737, 7.35002809820136],
    image: 'https://api.getwemap.com/images/pps-picpoints/806c07c94236a12186c81d44.19407521.jpg',
  },
];

export const baseAnimals: Animal[] = animalSeeds.map((animal) => ({
  id: animal.id,
  name: animal.name,
  species: animal.species,
  category: 'mammal',
  zoneName: animal.name,
  position: animal.position,
  image: animal.image,
  description: animal.description,
  funFact: animal.funFact,
  conservationStatus: animal.conservationStatus,
  feedingTimes: DEFAULT_FEEDING,
  capacity: DEFAULT_CAPACITY,
  visitorCount: DEFAULT_VISITORS,
  crowdLevel: 'moderate',
  enclosure: {
    name: animal.name,
    position: animal.position,
    radius: DEFAULT_RADIUS,
  },
}));
