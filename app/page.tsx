'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { baseBadges } from './data/badges';
import { baseAnimals } from './data/animals';
import { pois } from './data/pois';
import { Animal, BadgeReward, CaptureIntent, CapturedPhoto, CaptureStep, CrowdLevel, CrowdReportEntry, ZooNotification } from './types/zoo';
import AnimalModal from '../components/ui/AnimalModal';
import { ZoodexPanel } from '@/components/ui/BadgePanel';
import { PhotoGallery } from '@/components/ui/PhotoGallery';
import { CrowdReportPanel } from '@/components/ui/CrowdReportPanel';
import { ZooLogo } from '@/components/ui/ZooLogo';
import { SettingsPanel } from '@/components/ui/SettingsPanel';
import {
  AlertTriangle,
  Camera,
  BookOpenCheck,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Navigation2,
  Settings,
  Sun,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const levelRatio: Record<CrowdLevel, number> = {
  low: 0.35,
  moderate: 0.65,
  high: 0.92,
};

const levelLabels: Record<CrowdLevel, string> = {
  low: 'faible',
  moderate: 'modérée',
  high: 'élevée',
};

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=47.7316&longitude=7.3478&current_weather=true&timezone=Europe%2FParis';

type WeatherState =
  | { status: 'loading' }
  | {
      status: 'ready';
      data: {
        temperature: number;
        windspeed: number;
        weathercode: number;
        time: string;
      };
    }
  | { status: 'error' };

type BottomNavAction = 'map' | 'photos' | 'zoodex' | 'report' | 'settings';

const weatherMetaMap: Record<number, { label: string; icon: LucideIcon; accent: string }> = {
  0: { label: 'Grand soleil', icon: Sun, accent: 'text-amber-600' },
  1: { label: 'Éclaircies', icon: CloudSun, accent: 'text-amber-600' },
  2: { label: 'Partiellement couvert', icon: CloudSun, accent: 'text-sky-600' },
  3: { label: 'Ciel couvert', icon: Cloud, accent: 'text-slate-600' },
  45: { label: 'Brouillard léger', icon: Cloud, accent: 'text-slate-600' },
  48: { label: 'Brouillard givrant', icon: Cloud, accent: 'text-slate-600' },
  51: { label: 'Bruine légère', icon: CloudRain, accent: 'text-blue-600' },
  53: { label: 'Bruine', icon: CloudRain, accent: 'text-blue-600' },
  55: { label: 'Bruine intense', icon: CloudRain, accent: 'text-blue-600' },
  61: { label: 'Pluie faible', icon: CloudRain, accent: 'text-blue-600' },
  63: { label: 'Pluie', icon: CloudRain, accent: 'text-blue-600' },
  65: { label: 'Pluie forte', icon: CloudRain, accent: 'text-blue-700' },
  80: { label: 'Averses', icon: CloudRain, accent: 'text-blue-700' },
  81: { label: 'Forte averse', icon: CloudRain, accent: 'text-blue-700' },
  95: { label: 'Orage', icon: CloudLightning, accent: 'text-purple-600' },
  96: { label: 'Orage grêle', icon: CloudLightning, accent: 'text-purple-600' },
};

const fallbackWeatherMeta = { label: 'Conditions variables', icon: Cloud, accent: 'text-slate-600' };

const getWeatherMeta = (code: number) => weatherMetaMap[code] ?? fallbackWeatherMeta;

const EARTH_RADIUS_METERS = 6371000;
const DEFAULT_PROXIMITY_RADIUS = 180;

const CROWD_STORAGE_KEY = 'captur_zoo_crowd_reports';
const PHOTOS_STORAGE_KEY = 'captur_zoo_photos';
const VISITED_ENCLOSURES_STORAGE_KEY = 'captur_zoo_visited_enclosures';
const ENCLOSURE_COOLDOWN_MS = 5 * 60 * 1000;
const captureStepLabel: Record<CaptureStep, string> = {
  enclosure: 'panneau',
  animal: 'animal',
};
const categoryEmoji: Record<Animal['category'], string> = {
  mammal: '🦁',
  bird: '🦩',
  reptile: '🐊',
  amphibian: '🐸',
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceMeters = (a: [number, number], b: [number, number]) => {
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

type OutgoingRealtimeMessage =
  | {
      type: 'crowd-report';
      payload: {
        report: CrowdReportEntry;
        animalId: string;
        level: CrowdLevel;
        visitorCount: number;
      };
    }
  | {
      type: 'notification';
      payload: ZooNotification;
    };

type RealtimeMessage = OutgoingRealtimeMessage & { source: string };


const ZooMap = dynamic(() => import('../components/ui/ZooMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Chargement de la carte...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapAnimals, setMapAnimals] = useState<Animal[]>(baseAnimals);
  const [zoodexOpen, setZoodexOpen] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [crowdReportOpen, setCrowdReportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [badges, setBadges] = useState(baseBadges);
  const [notifications, setNotifications] = useState<ZooNotification[]>([]);
  const [crowdReports, setCrowdReports] = useState<CrowdReportEntry[]>([]);
  const [visitedAnimalIds, setVisitedAnimalIds] = useState<string[]>([]);
  const [capturedAnimalIds, setCapturedAnimalIds] = useState<string[]>([]);
  const [capturedEnclosureIds, setCapturedEnclosureIds] = useState<string[]>([]);
  const [visitedEnclosureIds, setVisitedEnclosureIds] = useState<string[]>([]);
  const [userLocated, setUserLocated] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [weatherState, setWeatherState] = useState<WeatherState>({ status: 'loading' });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [proximityAlertsEnabled, setProximityAlertsEnabled] = useState(false);
  const [badgeToast, setBadgeToast] = useState<BadgeReward | null>(null);
  const [activeNav, setActiveNav] = useState<BottomNavAction>('map');
  const [locationOptIn, setLocationOptIn] = useState(true);
  const [cameraAccessEnabled, setCameraAccessEnabled] = useState(true);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [recentEnclosureId, setRecentEnclosureId] = useState<string | null>(null);
  const highCrowdZonesRef = useRef<Set<string>>(new Set());
  const lastGeoErrorRef = useRef<string | null>(null);
  const deliveredProximityRef = useRef<Set<string>>(new Set());
  const enclosureCooldownRef = useRef<Map<string, number>>(new Map());
  const mainRef = useRef<HTMLElement | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const realtimeChannelRef = useRef<BroadcastChannel | null>(null);
  const clientIdRef = useRef<string>(`client-${Math.random().toString(36).slice(2)}`);
  const [mapReservedSpace, setMapReservedSpace] = useState(180);

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
    setVisitedAnimalIds((prev) => (prev.includes(animal.id) ? prev : [...prev, animal.id]));
  };

  const persistCrowdReports = useCallback((nextReports: CrowdReportEntry[]) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(CROWD_STORAGE_KEY, JSON.stringify(nextReports));
    } catch (error) {
      console.warn('Impossible de persister les signalements', error);
    }
  }, []);

  const persistCapturedPhotos = useCallback((nextPhotos: CapturedPhoto[]) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(nextPhotos));
    } catch (error) {
      console.warn('Impossible de sauvegarder les photos', error);
    }
  }, []);

  const readFileAsDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('lecture-failed'));
      reader.readAsDataURL(file);
    });
  }, []);

  const downloadPhoto = useCallback((dataUrl: string, filename: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const sendRealtimeMessage = useCallback(
    (message: OutgoingRealtimeMessage) => {
      const channel = realtimeChannelRef.current;
      if (!channel) {
        return;
      }
      channel.postMessage({ ...message, source: clientIdRef.current } as RealtimeMessage);
    },
    []
  );

  const unlockBadge = useCallback((badgeId: string) => {
    let unlockedBadge: BadgeReward | null = null;
    setBadges((current) =>
      current.map((badge) => {
        if (badge.id !== badgeId) {
          return badge;
        }
        if (badge.unlocked) {
          return badge;
        }
        const nextBadge = {
          ...badge,
          unlocked: true,
          progress: 1,
        };
        unlockedBadge = nextBadge;
        return nextBadge;
      })
    );
    if (unlockedBadge) {
      setBadgeToast(unlockedBadge);
    }
  }, []);

  const addNotification = useCallback(
    (payload: Omit<ZooNotification, 'id' | 'timestamp' | 'unread'>, options?: { broadcast?: boolean }) => {
      const nextNotification: ZooNotification = {
        id: `notif-${Date.now()}`,
        unread: true,
        timestamp: new Date().toISOString(),
        ...payload,
      };
      setNotifications((prev) => [nextNotification, ...prev]);
      if (options?.broadcast) {
        sendRealtimeMessage({ type: 'notification', payload: nextNotification });
      }
    },
    [sendRealtimeMessage]
  );

  const computeCrowdLevel = (count: number, capacity: number) => {
    const ratio = count / capacity;
    if (ratio >= 0.85) return 'high';
    if (ratio >= 0.55) return 'moderate';
    return 'low';
  };

  const simulateCrowd = useCallback(() => {
    const alerts: Array<{ zone: string; count: number; capacity: number; coords: [number, number] }> = [];

    setMapAnimals((prev) =>
      prev.map((animal) => {
        const delta = Math.round((Math.random() - 0.25) * 15);
        const nextCount = Math.min(animal.capacity, Math.max(0, animal.visitorCount + delta));
        const nextLevel = computeCrowdLevel(nextCount, animal.capacity);

        if (nextLevel === 'high' && !highCrowdZonesRef.current.has(animal.id)) {
          highCrowdZonesRef.current.add(animal.id);
          alerts.push({ zone: animal.zoneName, count: nextCount, capacity: animal.capacity, coords: animal.position });
        } else if (nextLevel !== 'high' && highCrowdZonesRef.current.has(animal.id)) {
          highCrowdZonesRef.current.delete(animal.id);
        }

        return { ...animal, visitorCount: nextCount, crowdLevel: nextLevel };
      })
    );

    alerts.forEach((alert) => {
      addNotification({
        title: `Affluence élevée - ${alert.zone}`,
        body: `Nous enregistrons ${alert.count} visiteurs (${Math.round((alert.count / alert.capacity) * 100)}% de la capacité).`,
        type: 'alert',
        location: {
          coords: alert.coords,
          radiusMeters: DEFAULT_PROXIMITY_RADIUS,
        },
      });
      unlockBadge('guardian');
    });
  }, [addNotification, unlockBadge]);

  useEffect(() => {
    simulateCrowd();
    const interval = setInterval(simulateCrowd, 15000);
    return () => clearInterval(interval);
  }, [simulateCrowd]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(CROWD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CrowdReportEntry[];
        if (Array.isArray(parsed)) {
          setCrowdReports(parsed);
        }
      }
    } catch (error) {
      console.warn('Impossible de charger les signalements sauvegardés', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const storedPhotos = window.localStorage.getItem(PHOTOS_STORAGE_KEY);
      if (storedPhotos) {
        const parsed = JSON.parse(storedPhotos) as CapturedPhoto[];
        if (Array.isArray(parsed)) {
          setCapturedPhotos(parsed);
        }
      }
    } catch (error) {
      console.warn('Impossible de charger les photos enregistrées', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const storedVisited = window.localStorage.getItem(VISITED_ENCLOSURES_STORAGE_KEY);
      if (storedVisited) {
        const parsed = JSON.parse(storedVisited) as string[];
        if (Array.isArray(parsed)) {
          setVisitedEnclosureIds(parsed);
        }
      }
    } catch (error) {
      console.warn('Impossible de charger les enclos visités', error);
    }
  }, []);


  useEffect(() => {
    persistCrowdReports(crowdReports);
  }, [crowdReports, persistCrowdReports]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(VISITED_ENCLOSURES_STORAGE_KEY, JSON.stringify(visitedEnclosureIds));
    } catch (error) {
      console.warn('Impossible de sauvegarder les enclos visités', error);
    }
  }, [visitedEnclosureIds]);


  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CROWD_STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as CrowdReportEntry[];
        if (Array.isArray(parsed)) {
          setCrowdReports(parsed);
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation des signalements', error);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (visitedAnimalIds.length >= 3) {
      unlockBadge('collector');
    }
  }, [visitedAnimalIds, unlockBadge]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return;
    }
    const channel = new window.BroadcastChannel('captur-zoo-live');
    realtimeChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent<RealtimeMessage>) => {
      const message = event.data;
      if (!message || message.source === clientIdRef.current) {
        return;
      }
      if (message.type === 'crowd-report') {
        setCrowdReports((prev) => {
          if (prev.some((entry) => entry.id === message.payload.report.id)) {
            return prev;
          }
          const next = [message.payload.report, ...prev];
          return next.slice(0, 50);
        });
        setMapAnimals((prev) =>
          prev.map((animal) =>
            animal.id === message.payload.animalId
              ? {
                  ...animal,
                  crowdLevel: message.payload.level,
                  visitorCount: message.payload.visitorCount,
                }
              : animal
          )
        );
      } else if (message.type === 'notification') {
        setNotifications((prev) => {
          if (prev.some((notif) => notif.id === message.payload.id)) {
            return prev;
          }
          return [message.payload, ...prev];
        });
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  useEffect(() => {
    if (userLocated) {
      unlockBadge('navigator');
    }
  }, [userLocated, unlockBadge]);

  const handleUserLocation = useCallback(
    (coords: [number, number]) => {
      if (!locationOptIn) {
        return;
      }
      setUserPosition(coords);
      if (!userLocated) {
        setUserLocated(true);
        addNotification({
          title: 'Localisation activée',
          body: `Position détectée (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`,
          type: 'info',
        });
      }
    },
    [addNotification, locationOptIn, userLocated]
  );

  const handleGeoError = useCallback(
    (message: string) => {
      if (lastGeoErrorRef.current === message) {
        return;
      }
      lastGeoErrorRef.current = message;
      addNotification({
        title: 'Géolocalisation indisponible',
        body: message,
        type: 'alert',
      });
    },
    [addNotification]
  );

  const triggerEnclosureVisit = useCallback(
    (animal: Animal) => {
      setVisitedEnclosureIds((prev) => (prev.includes(animal.id) ? prev : [...prev, animal.id]));
      setRecentEnclosureId(animal.id);
      setTimeout(() => {
        setRecentEnclosureId((current) => (current === animal.id ? null : current));
      }, 4000);
      addNotification({
        title: `${categoryEmoji[animal.category]} Enclos détecté - ${animal.name}`,
        body: `${animal.enclosure.name} · Scanne le panneau officiel puis capture l’animal pour valider cette rencontre.`,
        type: 'event',
        location: {
          coords: animal.enclosure.position,
          radiusMeters: animal.enclosure.radius,
        },
      });
    },
    [addNotification]
  );

  const checkEnclosureProximity = useCallback(
    (coords: [number, number]) => {
      if (!locationOptIn) {
        return;
      }
      const now = Date.now();
      mapAnimals.forEach((animal) => {
        const distance = getDistanceMeters(coords, animal.enclosure.position);
        if (distance > animal.enclosure.radius) {
          return;
        }
        const lastTrigger = enclosureCooldownRef.current.get(animal.id) ?? 0;
        if (now - lastTrigger < ENCLOSURE_COOLDOWN_MS) {
          return;
        }
        enclosureCooldownRef.current.set(animal.id, now);
        triggerEnclosureVisit(animal);
      });
    },
    [locationOptIn, mapAnimals, triggerEnclosureVisit]
  );

  useEffect(() => {
    if (!userPosition) {
      return;
    }
    checkEnclosureProximity(userPosition);
  }, [userPosition, checkEnclosureProximity]);

  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch(WEATHER_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Weather fetch failed');
      }
      const payload = await response.json();
      const current = payload.current_weather;
      if (!current) {
        throw new Error('Missing payload');
      }
      setWeatherState({
        status: 'ready',
        data: {
          temperature: current.temperature,
          windspeed: current.windspeed,
          weathercode: current.weathercode,
          time: current.time,
        },
      });
    } catch (error) {
      console.error('Weather error', error);
      setWeatherState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  useEffect(() => {
    if (!badgeToast) {
      return undefined;
    }
    const timer = setTimeout(() => setBadgeToast(null), 4200);
    return () => clearTimeout(timer);
  }, [badgeToast]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    setNotificationPermission(Notification.permission);
    if (Notification.permission === 'granted') {
      setProximityAlertsEnabled(true);
    }
  }, []);

  const showDeviceNotification = useCallback(
    async (notification: ZooNotification) => {
      if (typeof window === 'undefined' || notificationPermission !== 'granted') {
        return;
      }

      const options: NotificationOptions = {
        body: notification.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { id: notification.id, type: notification.type },
        tag: notification.id,
        vibrate: [200, 75, 200],
      };

      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(notification.title, options);
          return;
        }
      } catch (error) {
        console.error('Service worker notification error', error);
      }

      if ('Notification' in window) {
        new Notification(notification.title, options);
      }
    },
    [notificationPermission]
  );

  useEffect(() => {
    if (!proximityAlertsEnabled || notificationPermission !== 'granted' || !userPosition) {
      return;
    }

    notifications.forEach((notification) => {
      if (!notification.location) {
        return;
      }
      if (deliveredProximityRef.current.has(notification.id)) {
        return;
      }
      const distance = getDistanceMeters(userPosition, notification.location.coords);
      const radius = notification.location.radiusMeters ?? DEFAULT_PROXIMITY_RADIUS;
      if (distance <= radius) {
        deliveredProximityRef.current.add(notification.id);
        void showDeviceNotification(notification);
      }
    });
  }, [notifications, proximityAlertsEnabled, notificationPermission, userPosition, showDeviceNotification]);

  const handleCrowdReport = useCallback(
    ({ animalId, level, comment }: { animalId: string; level: CrowdLevel; comment: string }) => {
      let updatedZone: Animal | null = null;

      setMapAnimals((prev) =>
        prev.map((animal) => {
          if (animal.id !== animalId) {
            return animal;
          }
          const visitorCount = Math.round(animal.capacity * levelRatio[level]);
          const updated = {
            ...animal,
            crowdLevel: level,
            visitorCount,
          };
          updatedZone = updated;
          return updated;
        })
      );

      if (!updatedZone) {
        return;
      }

      const reportEntry: CrowdReportEntry = {
        id: `report-${Date.now()}`,
        animalId: updatedZone.id,
        animalName: updatedZone.name,
        zoneName: updatedZone.zoneName,
        level,
        visitorCount: updatedZone.visitorCount,
        comment: comment || undefined,
        timestamp: new Date().toISOString(),
        contributor: 'Visiteur anonyme',
      };

      setCrowdReports((prev) => [reportEntry, ...prev].slice(0, 50));
      sendRealtimeMessage({
        type: 'crowd-report',
        payload: {
          report: reportEntry,
          animalId: updatedZone.id,
          level,
          visitorCount: updatedZone.visitorCount,
        },
      });

      addNotification(
        {
          title: `Signalement ${levelLabels[level]} - ${updatedZone.zoneName}`,
          body: `${comment ? `${comment} · ` : ''}Affluence estimée à ${updatedZone.visitorCount}/${updatedZone.capacity} visiteurs.`,
          type: level === 'high' ? 'alert' : 'info',
          location: {
            coords: updatedZone.position,
            radiusMeters: DEFAULT_PROXIMITY_RADIUS,
          },
        },
        { broadcast: true }
      );
      unlockBadge('guardian');
    },
    [addNotification, sendRealtimeMessage, unlockBadge]
  );

  const handleCaptureEnclosure = (animalId: string) => {
    if (capturedEnclosureIds.includes(animalId)) {
      return;
    }
    setCapturedEnclosureIds((prev) => [...prev, animalId]);
    const targetAnimal = mapAnimals.find((animal) => animal.id === animalId);
    addNotification({
      title: targetAnimal ? `Panneau scanné - ${targetAnimal.zoneName}` : 'Panneau scanné',
      body: targetAnimal
        ? `Tu peux maintenant tenter de capturer ${targetAnimal.name}.`
        : 'Le panneau est enregistré, poursuis la capture de l’animal.',
      type: 'info',
      location: targetAnimal
        ? {
            coords: targetAnimal.position,
            radiusMeters: 120,
          }
        : undefined,
    });
  };

  const handleCaptureAnimal = (animalId: string) => {
    if (capturedAnimalIds.includes(animalId)) {
      return;
    }
    setCapturedAnimalIds((prev) => [...prev, animalId]);
    const targetAnimal = mapAnimals.find((animal) => animal.id === animalId);
    addNotification({
      title: targetAnimal ? `🎉 Animal débloqué - ${targetAnimal.name}` : 'Animal débloqué',
      body: targetAnimal
        ? `${targetAnimal.name} est maintenant visible en couleur dans ton Pokédex!`
        : 'Nouvel animal débloqué dans ton Pokédex!',
      type: 'event',
      location: targetAnimal
        ? {
            coords: targetAnimal.position,
            radiusMeters: 130,
          }
        : undefined,
    });
  };

  const handlePhotoUpload = useCallback(
    async (file: File, intent: CaptureIntent) => {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const targetAnimal = mapAnimals.find((animal) => animal.id === intent.animalId) ?? null;
        const filenameBase = targetAnimal ? targetAnimal.name.replace(/\s+/g, '-').toLowerCase() : 'capture';
        const filename = `${filenameBase}-${intent.step}-${Date.now()}.jpg`;
        const photo: CapturedPhoto = {
          id: `photo-${Date.now()}`,
          animalId: intent.animalId,
          step: intent.step,
          takenAt: new Date().toISOString(),
          dataUrl,
          filename,
        };
        setCapturedPhotos((prev) => {
          const next = [photo, ...prev];
          persistCapturedPhotos(next);
          return next;
        });
        downloadPhoto(dataUrl, filename);
        addNotification({
          title: 'Photo enregistrée',
          body: targetAnimal
            ? `${targetAnimal.name} (${captureStepLabel[intent.step]}) ajouté à ton Zoodex.`
            : 'Nouvelle capture ajoutée à ton Zoodex.',
          type: 'event',
        });
        unlockBadge('shutterbug');
      } catch (error) {
        console.error('Photo capture error', error);
        addNotification({
          title: 'Erreur capture',
          body: 'Impossible de sauvegarder la photo. Réessaie dans un instant.',
          type: 'alert',
        });
      }
    },
    [addNotification, downloadPhoto, mapAnimals, persistCapturedPhotos, readFileAsDataUrl, unlockBadge]
  );

  const handleBadgeToggle = useCallback((badgeId: string, shouldUnlock: boolean) => {
    let toggledBadge: BadgeReward | null = null;
    setBadges((current) =>
      current.map((badge) => {
        if (badge.id !== badgeId) {
          return badge;
        }
        const nextBadge = {
          ...badge,
          unlocked: shouldUnlock,
          progress: shouldUnlock ? 1 : 0,
        };
        toggledBadge = nextBadge;
        return nextBadge;
      })
    );
    if (shouldUnlock && toggledBadge) {
      setBadgeToast(toggledBadge);
    }
  }, []);

  const handleEnableProximityAlerts = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      addNotification({
        title: 'Notifications locales indisponibles',
        body: 'Ton appareil ne supporte pas les alertes de proximité.',
        type: 'info',
      });
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    setNotificationPermission(permission);
    if (permission === 'granted') {
      setProximityAlertsEnabled(true);
    } else if (permission === 'denied') {
      addNotification({
        title: 'Notifications bloquées',
        body: 'Active les notifications dans les réglages système pour recevoir les alertes de proximité.',
        type: 'alert',
      });
    }
  }, [addNotification]);

  const handleToggleLocation = useCallback(
    (next: boolean) => {
      setLocationOptIn(next);
      if (!next) {
        setUserPosition(null);
        setUserLocated(false);
        addNotification({
          title: 'Localisation coupée',
          body: 'La carte ne suivra plus ta position tant que tu ne la réactives pas.',
          type: 'info',
        });
      } else {
        addNotification({
          title: 'Localisation réactivée',
          body: 'Déplace-toi sur la carte pour forcer une nouvelle détection.',
          type: 'info',
        });
      }
    },
    [addNotification]
  );

  const handleToggleNotifications = useCallback(
    (next: boolean) => {
      if (next) {
        setProximityAlertsEnabled(true);
        void handleEnableProximityAlerts();
        return;
      }
      setProximityAlertsEnabled(false);
      addNotification({
        title: 'Alertes éloignées',
        body: 'Tu ne recevras plus d’alertes push avant de les réactiver.',
        type: 'info',
      });
    },
    [addNotification, handleEnableProximityAlerts]
  );

  const handleToggleCamera = useCallback(
    (next: boolean) => {
      setCameraAccessEnabled(next);
      addNotification({
        title: next ? 'Caméra prête' : 'Caméra désactivée',
        body: next
          ? 'Les captures AR et le Zoodex sont de nouveau disponibles.'
          : 'Les boutons de capture resteront inactifs.',
        type: 'info',
      });
    },
    [addNotification]
  );

  const closeAllPanels = useCallback(() => {
    setZoodexOpen(false);
    setPhotoGalleryOpen(false);
    setCrowdReportOpen(false);
    setSettingsOpen(false);
  }, []);

  const resetNavToMap = useCallback(() => setActiveNav('map'), []);

  const handleRequestCaptureFromModal = useCallback(() => {
    closeAllPanels();
    setPhotoGalleryOpen(true);
    setActiveNav('photos');
  }, [closeAllPanels]);

  const handleReturnToMap = useCallback(() => {
    setSettingsOpen(false);
    resetNavToMap();
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [resetNavToMap, mapSectionRef]);

  const renderWeatherChip = () => {
    if (weatherState.status === 'loading') {
      return <span className="text-white/70">Chargement météo...</span>;
    }
    if (weatherState.status === 'error') {
      return <span className="text-[#ffd0c3]">Météo indisponible</span>;
    }
    const meta = getWeatherMeta(weatherState.data.weathercode);
    const WeatherIcon = meta.icon;
    const formattedTime = new Date(weatherState.data.time).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <>
        <WeatherIcon className={`h-4 w-4 ${meta.accent}`} />
        <span className="font-semibold text-[#102923]">
          {Math.round(weatherState.data.temperature)}°C
        </span>
        <span className="hidden text-[#4c5a53] sm:inline">{meta.label}</span>
        <span className="flex items-center gap-1 text-[11px] text-[#4c5a53]">
          <Wind className="h-3 w-3" />
          {Math.round(weatherState.data.windspeed)} km/h
        </span>
        <span className="text-[10px] text-[#8c9187]">MAJ {formattedTime}</span>
      </>
    );
  };

  const weatherChip = renderWeatherChip();

  const bottomNavItems: Array<{ id: string; label: string; icon: LucideIcon; action: BottomNavAction }> = [
    { id: 'map', label: 'Carte', icon: Navigation2, action: 'map' },
    { id: 'photos', label: 'Photos', icon: Camera, action: 'photos' },
    { id: 'zoodex', label: 'Zoodex', icon: BookOpenCheck, action: 'zoodex' },
    { id: 'report', label: 'Signaler', icon: AlertTriangle, action: 'report' },
    { id: 'settings', label: 'Réglages', icon: Settings, action: 'settings' },
  ];

  const navItemsExcludingPhotos = bottomNavItems.filter((item) => item.action !== 'photos');
  const midpoint = Math.ceil(navItemsExcludingPhotos.length / 2);
  const leftNavItems = navItemsExcludingPhotos.slice(0, midpoint);
  const rightNavItems = navItemsExcludingPhotos.slice(midpoint);

  const renderBottomNavButton = (item: (typeof bottomNavItems)[number]) => {
    const isActive = activeNav === item.action;
    return (
      <button
        key={item.id}
        type="button"
        className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-center transition ${
          isActive
            ? 'bg-[#0d4f4a] text-white shadow-lg shadow-[#0d4f4a]/30'
            : 'text-[#7a6f60] hover:bg-white/60'
        }`}
        aria-pressed={isActive}
        onClick={() => handleBottomNav(item.action)}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.label}</span>
      </button>
    );
  };

  const handleBottomNav = (action: BottomNavAction) => {
    if (action === 'map') {
      closeAllPanels();
      resetNavToMap();
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    closeAllPanels();
    setActiveNav(action);

    switch (action) {
      case 'photos':
        setPhotoGalleryOpen(true);
        break;
      case 'zoodex':
        setZoodexOpen(true);
        break;
      case 'report':
        setCrowdReportOpen(true);
        break;
      case 'settings':
        setSettingsOpen(true);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateReservedSpace = () => {
      const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 0;
      const sectionPadding = mapSectionRef.current
        ? parseFloat(window.getComputedStyle(mapSectionRef.current).paddingBottom || '0')
        : 0;
      const mainPadding = mainRef.current
        ? parseFloat(window.getComputedStyle(mainRef.current).paddingBottom || '0')
        : 0;
      setMapReservedSpace(Math.round(headerHeight + sectionPadding + mainPadding));
    };

    updateReservedSpace();
    window.addEventListener('resize', updateReservedSpace);

    let resizeObserver: ResizeObserver | undefined;
    if (headerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => updateReservedSpace());
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateReservedSpace);
      resizeObserver?.disconnect();
    };
  }, []);

  const mapHeight = `calc(100vh - ${mapReservedSpace}px)`;

  return (
    <main ref={mainRef} className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-0">
      {/* Header */}
      <div
        ref={headerRef}
        className="sticky top-0 z-[1100] border-b border-white/10 bg-gradient-to-r from-[#0d4f4a]/95 via-[#0e5d54]/95 to-[#127c63]/95 text-white shadow-lg backdrop-blur"
      >
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <ZooLogo />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/90 px-4 py-1.5 text-xs font-medium text-[#1f2c27] shadow-md">
              {weatherChip}
            </div>
          </div>
        </div>
      </div>
      {/* Carte */}
      <div
        ref={mapSectionRef}
        className="relative flex-1 w-full"
        style={{ height: mapHeight }}
      >
        <div className="h-full w-full" style={{ height: mapHeight }}>
          <ZooMap
            animals={mapAnimals}
            onAnimalClick={handleAnimalClick}
            onUserLocation={handleUserLocation}
            onGeoError={handleGeoError}
            pois={pois}
            height={mapHeight}
            locationEnabled={locationOptIn}
            visitedEnclosures={visitedEnclosureIds}
            activeEnclosureId={recentEnclosureId}
          />
        </div>
      </div>

      {/* Modal */}
      <AnimalModal
        animal={selectedAnimal}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRequestCapture={handleRequestCaptureFromModal}
      />

      <ZoodexPanel
        animals={mapAnimals}
        capturedAnimals={capturedAnimalIds}
        capturedEnclosures={capturedEnclosureIds}
        open={zoodexOpen}
        onClose={() => {
          setZoodexOpen(false);
          resetNavToMap();
        }}
      />
      <PhotoGallery
        animals={mapAnimals}
        capturedAnimals={capturedAnimalIds}
        capturedEnclosures={capturedEnclosureIds}
        open={photoGalleryOpen}
        onClose={() => {
          setPhotoGalleryOpen(false);
          resetNavToMap();
        }}
        onCaptureAnimal={handleCaptureAnimal}
        onCaptureEnclosure={handleCaptureEnclosure}
        onUploadPhoto={handlePhotoUpload}
        cameraEnabled={cameraAccessEnabled}
      />
      <CrowdReportPanel
        animals={mapAnimals}
        open={crowdReportOpen}
        onClose={() => {
          setCrowdReportOpen(false);
          resetNavToMap();
        }}
        onReport={handleCrowdReport}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          resetNavToMap();
        }}
        onReturnToMap={handleReturnToMap}
        locationEnabled={locationOptIn}
        onToggleLocation={handleToggleLocation}
        notificationsEnabled={proximityAlertsEnabled && notificationPermission === 'granted'}
        onToggleNotifications={handleToggleNotifications}
        notificationPermission={notificationPermission}
        cameraEnabled={cameraAccessEnabled}
        onToggleCamera={handleToggleCamera}
      />
      {badgeToast && (
        <div className="pointer-events-none fixed inset-x-0 top-28 z-[1500] flex justify-center px-4">
          <div className="badge-pop w-full max-w-sm rounded-3xl border border-[#f4d9a7] bg-[#fff9f0]/95 p-5 text-center shadow-2xl">
            <div className="mb-3 text-5xl" aria-hidden>
              {badgeToast.icon}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#7fba39]">
              Badge débloqué
            </p>
            <p className="text-xl font-bold text-[#1c2822]">{badgeToast.title}</p>
            <p className="text-sm text-[#5b564a]">{badgeToast.description}</p>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-4 left-1/2 z-[1200] w-[94%] max-w-2xl -translate-x-1/2 rounded-3xl border border-[#f4dcb2] bg-gradient-to-r from-[#fff8ec]/95 via-[#fef1d6]/95 to-[#ffe8bd]/95 px-3 py-3 shadow-[0_20px_45px_rgba(13,79,74,0.25)] backdrop-blur">
        <div className="relative">
          <div className="flex items-stretch gap-3 text-[10px] font-semibold">
            {leftNavItems.map((item) => renderBottomNavButton(item))}
            <div className="pointer-events-none w-14 shrink-0 sm:w-20" aria-hidden />
            {rightNavItems.map((item) => renderBottomNavButton(item))}
          </div>
          <button
            type="button"
            className={`absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-8 flex-col items-center rounded-full border-4 border-white px-5 py-3 text-center shadow-[0_15px_40px_rgba(90,42,0,0.45)] transition ${
              activeNav === 'photos'
                ? 'bg-gradient-to-b from-[#ffe052] to-[#ffa930] text-[#4a2400]'
                : 'bg-gradient-to-b from-[#fff0ae] to-[#ffc970] text-[#6d3603] hover:-translate-y-9'
            }`}
            aria-label="Ouvrir la galerie photo"
            aria-pressed={activeNav === 'photos'}
            onClick={() => handleBottomNav('photos')}
          >
            <Camera className="h-7 w-7" />
            <span className="mt-1 text-[11px] font-black uppercase tracking-wide">Photos</span>
          </button>
        </div>
      </div>
    </main>
  );
}