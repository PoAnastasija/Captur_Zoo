import { useCallback, useEffect, useRef, useState } from 'react';
import { Animal } from '@/app/types/zoo';

const EARTH_RADIUS_METERS = 6371000;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const GEOFENCE_STORAGE_KEY = 'captur_zoo_geofence_state';

interface GeofenceState {
  lastTriggerTimes: Record<string, number>; // animalId -> timestamp
  visitedEnclosures: string[]; // list of visited animal IDs
}

const toRadians = (value: number) => (value * Math.PI) / 180;

export const getDistanceMeters = (a: [number, number], b: [number, number]): number => {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_METERS * c;
};

export interface UseGeofencingOptions {
  animals: Animal[];
  userPosition: [number, number] | null;
  onEnclosureEntered?: (animal: Animal) => void;
  enabled?: boolean;
}

export const useGeofencing = ({
  animals,
  userPosition,
  onEnclosureEntered,
  enabled = true,
}: UseGeofencingOptions) => {
  const [visitedEnclosures, setVisitedEnclosures] = useState<string[]>([]);
  const lastTriggerTimesRef = useRef<Record<string, number>>({});
  const previousPositionRef = useRef<[number, number] | null>(null);

  // Load state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(GEOFENCE_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored) as GeofenceState;
        lastTriggerTimesRef.current = state.lastTriggerTimes || {};
        setVisitedEnclosures(state.visitedEnclosures || []);
      }
    } catch (error) {
      console.warn('Failed to load geofence state from localStorage', error);
    }
  }, []);

  // Persist state to localStorage
  const persistState = useCallback((visited: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      const state: GeofenceState = {
        lastTriggerTimes: lastTriggerTimesRef.current,
        visitedEnclosures: visited,
      };
      window.localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to persist geofence state to localStorage', error);
    }
  }, []);

  // Check geofences when position changes
  useEffect(() => {
    if (!enabled || !userPosition || !animals.length) return;

    // Only check if position has actually changed meaningfully (at least 5 meters)
    if (previousPositionRef.current) {
      const distanceMoved = getDistanceMeters(previousPositionRef.current, userPosition);
      if (distanceMoved < 5) return; // Skip if moved less than 5 meters
    }

    previousPositionRef.current = userPosition;
    const now = Date.now();

    animals.forEach((animal) => {
      if (!animal.enclosure) return;

      const distanceToEnclosure = getDistanceMeters(userPosition, animal.enclosure.position);
      const isInside = distanceToEnclosure <= animal.enclosure.radius;

      if (!isInside) return;

      // Check if we're in cooldown period
      const lastTrigger = lastTriggerTimesRef.current[animal.id] || 0;
      if (now - lastTrigger < COOLDOWN_MS) return; // Still in cooldown

      // Trigger the event
      lastTriggerTimesRef.current[animal.id] = now;

      // Mark as visited
      setVisitedEnclosures((prev) => {
        const updated = prev.includes(animal.id) ? prev : [...prev, animal.id];
        persistState(updated);
        return updated;
      });

      // Call the callback
      if (onEnclosureEntered) {
        onEnclosureEntered(animal);
      }
    });
  }, [userPosition, animals, enabled, onEnclosureEntered, persistState]);

  const isEnclosureVisited = useCallback((animalId: string) => {
    return visitedEnclosures.includes(animalId);
  }, [visitedEnclosures]);

  const markEnclosureAsVisited = useCallback((animalId: string) => {
    setVisitedEnclosures((prev) => {
      const updated = prev.includes(animalId) ? prev : [...prev, animalId];
      persistState(updated);
      return updated;
    });
  }, [persistState]);

  const getTimeUntilCooldownExpires = useCallback((animalId: string) => {
    const lastTrigger = lastTriggerTimesRef.current[animalId];
    if (!lastTrigger) return 0;
    const elapsed = Date.now() - lastTrigger;
    const remaining = Math.max(0, COOLDOWN_MS - elapsed);
    return remaining;
  }, []);

  return {
    visitedEnclosures,
    isEnclosureVisited,
    markEnclosureAsVisited,
    getTimeUntilCooldownExpires,
  };
};
