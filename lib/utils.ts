import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Génère un chemin courbe entre deux points avec des waypoints intermédiaires
 * pour créer un sentier de navigation fluide
 */
export function generatePath(
  start: [number, number],
  end: [number, number],
  numWaypoints: number = 20
): Array<[number, number]> {
  const path: Array<[number, number]> = [];
  
  // Ajouter le point de départ
  path.push(start);
  
  // Générer les waypoints intermédiaires avec une courbe lisse
  for (let i = 1; i < numWaypoints; i++) {
    const t = i / numWaypoints;
    
    // Interpolation linéaire basique
    const lat = start[0] + (end[0] - start[0]) * t;
    const lng = start[1] + (end[1] - start[1]) * t;
    
    // Ajouter une petite déviation sinusoïdale pour rendre le chemin plus organique
    const deviation = Math.sin(t * Math.PI) * 0.0002;
    
    path.push([
      lat + deviation,
      lng + deviation * 0.5
    ]);
  }
  
  // Ajouter le point d'arrivée
  path.push(end);
  
  return path;
}

/**
 * Calcule la distance entre deux points en mètres
 */
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const EARTH_RADIUS_METERS = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_METERS * c;
}