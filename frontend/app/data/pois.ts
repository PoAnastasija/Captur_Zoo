'use client';

import { Poi, PoiCategory } from '../types/zoo';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost';
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT;

export class PoiApiError extends Error {
  constructor(message = 'Impossible de récupérer les POIs.') {
    super(message);
    this.name = 'PoiApiError';
  }
}

export interface RemotePoi {
  id?: string | number;
  name: string;
  latitude: number;
  longitude: number;
  image?: string | null;
  icon?: string | null;
  type?: string | null;
  affluence?: number | null;
  description?: string | null;
  link?: string | null;
}

const TYPE_CATEGORY_MAP: Record<string, PoiCategory> = {
  animaux: 'animals',
  végétaux: 'plants',
  vegetaux: 'plants',
  pratique: 'practical',
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'poi';

const mapCategory = (value?: string | null): PoiCategory => {
  if (!value) {
    return 'other';
  }
  const normalized = value.trim().toLowerCase();
  return TYPE_CATEGORY_MAP[normalized] ?? 'other';
};

const normalizeAffluence = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.round(Math.max(0, Math.min(100, value)));
};

const mapRemotePoi = (poi: RemotePoi): Poi => {
  const idBase = poi.id ? String(poi.id) : `${slugify(poi.name)}-${poi.latitude.toFixed(5)}-${poi.longitude.toFixed(5)}`;
  return {
    id: idBase,
    name: poi.name,
    latitude: poi.latitude,
    longitude: poi.longitude,
    tags: poi.type ? [poi.type] : [],
    category: mapCategory(poi.type),
    description: poi.description ?? undefined,
    imageUrl: poi.image ?? null,
    iconUrl: poi.icon ?? null,
    affluence: normalizeAffluence(poi.affluence),
    sourceType: poi.type ?? null,
    linkUrl: poi.link ?? null,
  };
};

export const normalizeRemotePois = (entries: RemotePoi[]): Poi[] => entries.map((entry) => mapRemotePoi(entry));

interface FetchPoisOptions {
  signal?: AbortSignal;
}

export async function fetchPois(options?: FetchPoisOptions): Promise<Poi[]> {
  if (typeof window === 'undefined') {
    throw new PoiApiError("La récupération des POIs doit s'effectuer côté client.");
  }

  const baseUrl = BACKEND_PORT ? `${BACKEND_URL}:${BACKEND_PORT}` : BACKEND_URL;
  const response = await fetch(`${baseUrl}/api/pois`, {
    headers: {
      Accept: 'application/json',
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new PoiApiError(details || `Erreur ${response.status} lors du chargement des POIs.`);
  }

  const payload = await response.json().catch(() => {
    throw new PoiApiError('Réponse JSON invalide reçue depuis le backend.');
  });

  if (!Array.isArray(payload)) {
    throw new PoiApiError('Format de réponse POI inattendu.');
  }

  return normalizeRemotePois(payload as RemotePoi[]);
}
