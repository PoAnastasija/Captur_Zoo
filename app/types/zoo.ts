export type PoiCategory = 'animals' | 'plants' | 'practical' | 'other';
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

export interface Poi {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  tags: string[];
  category: PoiCategory;
  description?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
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

export interface NotificationLocation {
  coords: [number, number];
  radiusMeters?: number;
}

export interface ZooNotification {
  id: string;
  title: string;
  body: string;
  type: 'event' | 'alert' | 'info';
  timestamp: string;
  unread: boolean;
  location?: NotificationLocation;
}

export interface PhotoQuest {
  id: string;
  title: string;
  description: string;
  targets: string[];
  reward: string;
  icon: string;
}

export interface CrowdReportEntry {
  id: string;
  animalId: string;
  animalName: string;
  zoneName: string;
  level: CrowdLevel;
  visitorCount: number;
  comment?: string;
  timestamp: string;
  contributor: string;
}