export interface Animal {
  id: string;
  name: string;
  species: string;
  category: 'mammal' | 'bird' | 'reptile' | 'amphibian';
  position: [number, number]; // [lat, lng]
  image: string;
  description: string;
  funFact: string;
  conservationStatus: 'LC' | 'NT' | 'VU' | 'EN' | 'CR';
  feedingTimes?: string[];
}

export interface Zone {
  id: string;
  name: string;
  type: 'enclosure' | 'facility' | 'rest-area';
  position: [number, number];
  icon: string;
}