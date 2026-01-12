export type CrowdLevel = 'low' | 'moderate' | 'high';

export interface Animal {
  id: string;
  name: string;
  species: string;
  category: 'mammal' | 'bird' | 'reptile' | 'amphibian';
  zoneName: string;
  position: [number, number]; // [lat, lng]
  image: string;
  description: string;
  funFact: string;
  conservationStatus: 'LC' | 'NT' | 'VU' | 'EN' | 'CR';
  feedingTimes?: string[];
  capacity: number;
  visitorCount: number;
  crowdLevel: CrowdLevel;
}

export interface Zone {
  id: string;
  name: string;
  type: 'enclosure' | 'facility' | 'rest-area';
  position: [number, number];
  icon: string;
}

export interface BadgeReward {
  id: string;
  title: string;
  description: string;
  requirement: string;
  unlocked: boolean;
  progress?: number;
  icon: string;
}

export interface ZooNotification {
  id: string;
  title: string;
  body: string;
  type: 'event' | 'alert' | 'info';
  timestamp: string;
  unread: boolean;
}