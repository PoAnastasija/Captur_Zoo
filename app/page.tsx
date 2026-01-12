'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { animals } from './data/animals';
import { baseBadges } from './data/badges';
import { pois } from './data/pois';
import { baseNotifications } from './data/notifications';
import { photoQuests as basePhotoQuests } from './data/objectives';
import { Animal, CrowdLevel, PhotoQuest, ZooNotification } from './types/zoo';
import AnimalModal from '../components/ui/AnimalModal';
import { Button } from '@/components/ui/button';
import { BadgePanel } from '@/components/ui/BadgePanel';
import { NotificationPanel } from '@/components/ui/NotificationPanel';
import { CrowdPanel } from '@/components/ui/CrowdPanel';
import { PhotoGallery } from '@/components/ui/PhotoGallery';
import { CrowdReportPanel } from '@/components/ui/CrowdReportPanel';
import { PhotoQuestPanel } from '@/components/ui/PhotoQuestPanel';
import {
  Bell,
  Camera,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  MapPin,
  Medal,
  Menu,
  Sparkles,
  Sun,
  Target,
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

type PhotoQuestProgress = PhotoQuest & { progress: number; completed: boolean };

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

const ZOO_BOUNDS: [[number, number], [number, number]] = [
  [47.7288, 7.3425],
  [47.7349, 7.3528],
];

const NEARBY_THRESHOLD_METERS = 130;

const toRad = (value: number) => (value * Math.PI) / 180;

const distanceInMeters = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
};


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
  const [mapAnimals, setMapAnimals] = useState<Animal[]>(animals);
  const [badgePanelOpen, setBadgePanelOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [crowdReportOpen, setCrowdReportOpen] = useState(false);
  const [questPanelOpen, setQuestPanelOpen] = useState(false);
  const [badges, setBadges] = useState(baseBadges);
  const [notifications, setNotifications] = useState<ZooNotification[]>(baseNotifications);
  const [visitedAnimalIds, setVisitedAnimalIds] = useState<string[]>([]);
  const [capturedAnimalIds, setCapturedAnimalIds] = useState<string[]>([]);
  const [photoQuests, setPhotoQuests] = useState<PhotoQuestProgress[]>(() =>
    basePhotoQuests.map((quest) => ({ ...quest, progress: 0, completed: false }))
  );
  const [userLocated, setUserLocated] = useState(false);
  const [weatherState, setWeatherState] = useState<WeatherState>({ status: 'loading' });
  const [proximityAlert, setProximityAlert] = useState<{ animalId: string; name: string; zone: string } | null>(null);
  const [crowdToast, setCrowdToast] = useState<string | null>(null);
  const highCrowdZonesRef = useRef<Set<string>>(new Set());
  const lastGeoErrorRef = useRef<string | null>(null);
  const completedQuestsRef = useRef<Set<string>>(new Set());
  const proximityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const crowdToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
    setVisitedAnimalIds((prev) => (prev.includes(animal.id) ? prev : [...prev, animal.id]));
  };

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  useEffect(() => {
    return () => {
      if (proximityTimeoutRef.current) {
        clearTimeout(proximityTimeoutRef.current);
      }
      if (crowdToastTimeoutRef.current) {
        clearTimeout(crowdToastTimeoutRef.current);
      }
    };
  }, []);

  const unlockBadge = useCallback((badgeId: string) => {
    setBadges((current) =>
      current.map((badge) =>
        badge.id === badgeId
          ? {
              ...badge,
              unlocked: true,
              progress: 1,
            }
          : badge
      )
    );
  }, []);

  const addNotification = useCallback((payload: Omit<ZooNotification, 'id' | 'timestamp' | 'unread'>) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        unread: true,
        timestamp: new Date().toISOString(),
        ...payload,
      },
      ...prev,
    ]);
  }, []);

  const computeCrowdLevel = (count: number, capacity: number) => {
    const ratio = count / capacity;
    if (ratio >= 0.85) return 'high';
    if (ratio >= 0.55) return 'moderate';
    return 'low';
  };

  const simulateCrowd = useCallback(() => {
    const alerts: Array<{ zone: string; count: number; capacity: number }> = [];

    setMapAnimals((prev) =>
      prev.map((animal) => {
        const delta = Math.round((Math.random() - 0.25) * 15);
        const nextCount = Math.min(animal.capacity, Math.max(0, animal.visitorCount + delta));
        const nextLevel = computeCrowdLevel(nextCount, animal.capacity);

        if (nextLevel === 'high' && !highCrowdZonesRef.current.has(animal.id)) {
          highCrowdZonesRef.current.add(animal.id);
          alerts.push({ zone: animal.zoneName, count: nextCount, capacity: animal.capacity });
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
    if (visitedAnimalIds.length >= 3) {
      unlockBadge('collector');
    }
  }, [visitedAnimalIds, unlockBadge]);

  useEffect(() => {
    const readCount = notifications.filter((notification) => !notification.unread).length;
    if (readCount >= 5) {
      unlockBadge('insider');
    }
  }, [notifications, unlockBadge]);

  useEffect(() => {
    if (userLocated) {
      unlockBadge('navigator');
    }
  }, [userLocated, unlockBadge]);

  useEffect(() => {
    const capturedSet = new Set(capturedAnimalIds);
    setPhotoQuests((prev) =>
      prev.map((quest) => {
        const hits = quest.targets.filter((target) => capturedSet.has(target)).length;
        const progress = hits / quest.targets.length;
        return { ...quest, progress, completed: progress === 1 };
      })
    );
  }, [capturedAnimalIds]);

  useEffect(() => {
    photoQuests.forEach((quest) => {
      if (quest.completed && !completedQuestsRef.current.has(quest.id)) {
        completedQuestsRef.current.add(quest.id);
        addNotification({
          title: `Quête terminée - ${quest.title}`,
          body: quest.reward,
          type: 'event',
        });
        unlockBadge('shutterbug');
      }
    });
  }, [photoQuests, addNotification, unlockBadge]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, unread: false })));
  };

  const maybeTriggerProximity = useCallback(
    (coords: [number, number]) => {
      if (!mapAnimals.length) {
        return;
      }

      let nearest: { animal: Animal; distance: number } | null = null;
      mapAnimals.forEach((animal) => {
        const distance = distanceInMeters(coords, animal.position);
        if (!nearest || distance < nearest.distance) {
          nearest = { animal, distance };
        }
      });

      if (nearest && nearest.distance <= NEARBY_THRESHOLD_METERS) {
        setProximityAlert((prev) => {
          if (prev?.animalId === nearest!.animal.id) {
            return prev;
          }
          return {
            animalId: nearest!.animal.id,
            name: nearest!.animal.name,
            zone: nearest!.animal.zoneName,
          };
        });

        if (proximityTimeoutRef.current) {
          clearTimeout(proximityTimeoutRef.current);
        }
        proximityTimeoutRef.current = setTimeout(() => setProximityAlert(null), 7000);
      }
    },
    [mapAnimals]
  );

  const handleUserLocation = useCallback(
    (coords: [number, number]) => {
      if (!userLocated) {
        setUserLocated(true);
        addNotification({
          title: 'Localisation activée',
          body: `Position détectée (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`,
          type: 'info',
        });
      }
      maybeTriggerProximity(coords);
    },
    [addNotification, maybeTriggerProximity, userLocated]
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

  const handleCrowdReport = useCallback(
    ({ animalId, level, comment }: { animalId: string; level: CrowdLevel; comment: string }) => {
      let updatedZone: Animal | null = null;

      setMapAnimals((prev) =>
        prev.map((animal) => {
          if (animal.id !== animalId) {
            return animal;
          }
          const updated = {
            ...animal,
            crowdLevel: level,
            visitorCount: Math.round(animal.capacity * levelRatio[level]),
          };
          updatedZone = updated;
          return updated;
        })
      );

      if (updatedZone) {
        addNotification({
          title: `Signalement ${levelLabels[level]} - ${updatedZone.zoneName}`,
          body: `${comment ? `${comment} · ` : ''}Affluence estimée à ${updatedZone.visitorCount}/${updatedZone.capacity} visiteurs.`,
          type: level === 'high' ? 'alert' : 'info',
        });
        unlockBadge('guardian');
        setCrowdToast(`Signalement partagé pour ${updatedZone.zoneName}`);
        if (crowdToastTimeoutRef.current) {
          clearTimeout(crowdToastTimeoutRef.current);
        }
        crowdToastTimeoutRef.current = setTimeout(() => setCrowdToast(null), 4000);
      }
    },
    [addNotification, unlockBadge]
  );

  const handleCaptureAnimal = (animalId: string) => {
    if (capturedAnimalIds.includes(animalId)) {
      return;
    }
    setCapturedAnimalIds((prev) => [...prev, animalId]);
    const targetAnimal =
      mapAnimals.find((animal) => animal.id === animalId) ?? animals.find((animal) => animal.id === animalId);
    addNotification({
      title: targetAnimal ? `Photo capturée - ${targetAnimal.name}` : 'Photo capturée',
      body: targetAnimal
        ? `Ajoutée à ton album dans la zone ${targetAnimal.zoneName}.`
        : 'Nouvelle capture ajoutée à ton album.',
      type: 'event',
    });
  };

  const handlePhotoUpload = useCallback(
    (file: File) => {
      addNotification({
        title: 'Photo importée',
        body: `Nouveau cliché ajouté (${file.name || 'photo mobile'}).`,
        type: 'event',
      });
      unlockBadge('shutterbug');
    },
    [addNotification, unlockBadge]
  );

  const renderWeatherChip = () => {
    if (weatherState.status === 'loading') {
      return <span className="text-gray-400">Chargement météo...</span>;
    }
    if (weatherState.status === 'error') {
      return <span className="text-red-500">Météo indisponible</span>;
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
        <span className="font-semibold text-gray-900">
          {Math.round(weatherState.data.temperature)}°C
        </span>
        <span className="hidden text-gray-500 sm:inline">{meta.label}</span>
        <span className="flex items-center gap-1 text-[11px] text-gray-500">
          <Wind className="h-3 w-3" />
          {Math.round(weatherState.data.windspeed)} km/h
        </span>
        <span className="text-[10px] text-gray-400">MAJ {formattedTime}</span>
      </>
    );
  };

  const weatherChip = renderWeatherChip();

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-[1100] border-b border-white/70 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              🦁 Zoo de Mulhouse
            </h1>
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
              {weatherChip}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setNotificationPanelOpen(true)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setBadgePanelOpen(true)}
              aria-label="Badges"
            >
              <Medal className="h-5 w-5 text-amber-500" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {proximityAlert && (
        <div className="pointer-events-auto absolute left-1/2 top-24 z-[1200] w-[95%] max-w-md -translate-x-1/2 sm:top-28">
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-white/95 p-3 shadow-xl backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg">📍</div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-gray-900">À proximité de {proximityAlert.zone}</p>
              <p className="text-xs text-gray-600">Passe voir {proximityAlert.name} pour capturer un souvenir.</p>
            </div>
            <button
              type="button"
              aria-label="Fermer la bulle de proximité"
              className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-200"
              onClick={() => setProximityAlert(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Carte */}
      <div className="relative flex-1">
        <ZooMap
          animals={mapAnimals}
          onAnimalClick={handleAnimalClick}
          onUserLocation={handleUserLocation}
          onGeoError={handleGeoError}
          bounds={ZOO_BOUNDS}
          pois={pois}
        />
      </div>

      {/* Crowd panel */}
      <div className="pointer-events-auto fixed right-3 top-[120px] z-[1000] hidden w-72 max-w-[calc(100%-2rem)] lg:block">
        <CrowdPanel animals={mapAnimals} onRefresh={simulateCrowd} />
      </div>

      <div className="px-4 pb-24 pt-4 lg:hidden">
        <CrowdPanel animals={mapAnimals} onRefresh={simulateCrowd} />
      </div>

      {/* Modal */}
      <AnimalModal
        animal={selectedAnimal}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Légende */}
      <div className="pointer-events-auto absolute bottom-4 left-4 z-[1000] max-w-xs rounded-2xl border border-white/70 bg-white/95 p-3 shadow-lg backdrop-blur">
        <h3 className="mb-2 text-sm font-semibold">Légende</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Mammifères</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Oiseaux</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Reptiles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span>Amphibiens</span>
          </div>
        </div>
      </div>

      {/* Experience shortcuts */}
      <div className="pointer-events-auto absolute bottom-4 right-4 z-[1000] max-w-[calc(100%-2rem)]">
        <div className="rounded-2xl border border-gray-100 bg-white/95 p-3 shadow-xl backdrop-blur">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Portail Express
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              className="flex flex-col rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-left text-xs font-semibold text-amber-800 transition hover:border-amber-200"
              onClick={() => setBadgePanelOpen(true)}
            >
              <span className="mb-1 text-base">🏅</span>
              Badges
              <span className="text-[10px] font-normal text-amber-700/80">Progression</span>
            </button>
            <button
              className="flex flex-col rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-800 transition hover:border-blue-200"
              onClick={() => setPhotoGalleryOpen(true)}
            >
              <Camera className="mb-1 h-4 w-4" />
              Photos
              <span className="text-[10px] font-normal text-blue-700/70">Galerie live</span>
            </button>
            <button
              className="flex flex-col rounded-xl border border-fuchsia-100 bg-fuchsia-50 px-3 py-2 text-left text-xs font-semibold text-fuchsia-800 transition hover:border-fuchsia-200"
              onClick={() => setQuestPanelOpen(true)}
            >
              <Target className="mb-1 h-4 w-4" />
              Objectifs
              <span className="text-[10px] font-normal text-fuchsia-700/70">Mode quêtes</span>
            </button>
            <button
              className="flex flex-col rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left text-xs font-semibold text-emerald-800 transition hover:border-emerald-200"
              onClick={() => setCrowdReportOpen(true)}
            >
              <MapPin className="mb-1 h-4 w-4" />
              Signaler
              <span className="text-[10px] font-normal text-emerald-700/70">Mode Waze</span>
            </button>
          </div>
        </div>
      </div>

      {crowdToast && (
        <div className="fixed bottom-28 left-1/2 z-[1200] w-[90%] max-w-sm -translate-x-1/2 rounded-full border border-emerald-200 bg-white/95 px-4 py-2 text-center text-xs font-semibold text-emerald-700 shadow-lg">
          {crowdToast}
        </div>
      )}

      <BadgePanel badges={badges} open={badgePanelOpen} onClose={() => setBadgePanelOpen(false)} />
      <NotificationPanel
        notifications={notifications}
        open={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllRead={handleMarkAllRead}
      />
      <PhotoGallery
        animals={mapAnimals}
        capturedIds={capturedAnimalIds}
        open={photoGalleryOpen}
        onClose={() => setPhotoGalleryOpen(false)}
        onCapture={handleCaptureAnimal}
        onUploadPhoto={handlePhotoUpload}
      />
      <CrowdReportPanel
        animals={mapAnimals}
        open={crowdReportOpen}
        onClose={() => setCrowdReportOpen(false)}
        onReport={handleCrowdReport}
      />
      <PhotoQuestPanel
        quests={photoQuests}
        animals={mapAnimals}
        capturedIds={capturedAnimalIds}
        open={questPanelOpen}
        onClose={() => setQuestPanelOpen(false)}
      />
    </main>
  );
}