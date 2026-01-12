export type PoiCategory = 'animals' | 'plants' | 'practical' | 'other';

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