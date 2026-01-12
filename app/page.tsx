'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { animals } from './data/animals';
import { baseBadges } from './data/badges';
import { pois } from './data/pois';
import { baseNotifications } from './data/notifications';
import { photoQuests as basePhotoQuests } from './data/objectives';
import { Animal, BadgeReward, CrowdLevel, PhotoQuest, ZooNotification } from './types/zoo';
import AnimalModal from '../components/ui/AnimalModal';
import { BadgePanel } from '@/components/ui/BadgePanel';
import { NotificationPanel } from '@/components/ui/NotificationPanel';
import { PhotoGallery } from '@/components/ui/PhotoGallery';
import { CrowdReportPanel } from '@/components/ui/CrowdReportPanel';
import { PhotoQuestPanel } from '@/components/ui/PhotoQuestPanel';
import {
  AlertTriangle,
  Bell,
  Camera,
  CalendarDays,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Medal,
  Navigation2,
  Smartphone,
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

type PhotoQuestProgress = PhotoQuest & { progress: number; completed: boolean };

type BottomNavAction = 'map' | 'agenda' | 'photos' | 'badges' | 'alerts' | 'report';

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

const EARTH_RADIUS_METERS = 6371000;
const DEFAULT_PROXIMITY_RADIUS = 180;

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
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [weatherState, setWeatherState] = useState<WeatherState>({ status: 'loading' });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [proximityAlertsEnabled, setProximityAlertsEnabled] = useState(false);
  const [badgeToast, setBadgeToast] = useState<BadgeReward | null>(null);
  const [activeNav, setActiveNav] = useState<BottomNavAction>('map');
  const highCrowdZonesRef = useRef<Set<string>>(new Set());
  const lastGeoErrorRef = useRef<string | null>(null);
  const completedQuestsRef = useRef<Set<string>>(new Set());
  const deliveredProximityRef = useRef<Set<string>>(new Set());
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
    setVisitedAnimalIds((prev) => (prev.includes(animal.id) ? prev : [...prev, animal.id]));
  };

  const unreadCount = notifications.filter((notification) => notification.unread).length;

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

  const handleUserLocation = useCallback(
    (coords: [number, number]) => {
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
    [addNotification, userLocated]
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
          location: {
            coords: updatedZone.position,
            radiusMeters: DEFAULT_PROXIMITY_RADIUS,
          },
        });
        unlockBadge('guardian');
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
      location: targetAnimal
        ? {
            coords: targetAnimal.position,
            radiusMeters: 130,
          }
        : undefined,
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

  const closeAllPanels = () => {
    setBadgePanelOpen(false);
    setNotificationPanelOpen(false);
    setPhotoGalleryOpen(false);
    setCrowdReportOpen(false);
    setQuestPanelOpen(false);
  };

  const resetNavToMap = () => setActiveNav('map');

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

  const bottomNavItems: Array<{ id: string; label: string; icon: LucideIcon; action: BottomNavAction }> = [
    { id: 'map', label: 'Carte', icon: Navigation2, action: 'map' },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays, action: 'agenda' },
    { id: 'photos', label: 'Photos', icon: Camera, action: 'photos' },
    { id: 'badges', label: 'Badges', icon: Medal, action: 'badges' },
    { id: 'alerts', label: 'Actus', icon: Bell, action: 'alerts' },
    { id: 'report', label: 'Signaler', icon: AlertTriangle, action: 'report' },
  ];

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
      case 'agenda':
        setQuestPanelOpen(true);
        break;
      case 'photos':
        setPhotoGalleryOpen(true);
        break;
      case 'badges':
        setBadgePanelOpen(true);
        break;
      case 'alerts':
        setNotificationPanelOpen(true);
        break;
      case 'report':
        setCrowdReportOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-50 pb-0">
      {/* Header */}
      <div className="sticky top-0 z-[1100] border-b border-white/70 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">🦁 Zoo de Mulhouse</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
              {weatherChip}
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  +{unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-pressed={proximityAlertsEnabled && notificationPermission === 'granted'}
              disabled={proximityAlertsEnabled && notificationPermission === 'granted'}
              onClick={handleEnableProximityAlerts}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                proximityAlertsEnabled && notificationPermission === 'granted'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              {proximityAlertsEnabled && notificationPermission === 'granted'
                ? 'Alertes proximité actives'
                : 'Activer alertes proximité'}
            </button>
          </div>
        </div>
      </div>
      {/* Carte */}
      <div ref={mapSectionRef} className="relative flex-1 w-full min-h-[calc(100vh-140px)]">
        <ZooMap
          animals={mapAnimals}
          onAnimalClick={handleAnimalClick}
          onUserLocation={handleUserLocation}
          onGeoError={handleGeoError}
          bounds={ZOO_BOUNDS}
          pois={pois}
        />
      </div>

      {/* Modal */}
      <AnimalModal
        animal={selectedAnimal}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <BadgePanel
        badges={badges}
        open={badgePanelOpen}
        onToggleBadge={handleBadgeToggle}
        onClose={() => {
          setBadgePanelOpen(false);
          resetNavToMap();
        }}
      />
      <NotificationPanel
        notifications={notifications}
        open={notificationPanelOpen}
        onClose={() => {
          setNotificationPanelOpen(false);
          resetNavToMap();
        }}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllRead={handleMarkAllRead}
      />
      <PhotoGallery
        animals={mapAnimals}
        capturedIds={capturedAnimalIds}
        open={photoGalleryOpen}
        onClose={() => {
          setPhotoGalleryOpen(false);
          resetNavToMap();
        }}
        onCapture={handleCaptureAnimal}
        onUploadPhoto={handlePhotoUpload}
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
      <PhotoQuestPanel
        quests={photoQuests}
        animals={mapAnimals}
        capturedIds={capturedAnimalIds}
        open={questPanelOpen}
        onClose={() => {
          setQuestPanelOpen(false);
          resetNavToMap();
        }}
      />

      {badgeToast && (
        <div className="pointer-events-none fixed inset-x-0 top-28 z-[1500] flex justify-center px-4">
          <div className="badge-pop w-full max-w-sm rounded-3xl border border-emerald-200 bg-white/95 p-5 text-center shadow-2xl">
            <div className="mb-3 text-5xl" aria-hidden>
              {badgeToast.icon}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
              Badge débloqué
            </p>
            <p className="text-xl font-bold text-gray-900">{badgeToast.title}</p>
            <p className="text-sm text-gray-500">{badgeToast.description}</p>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-4 left-1/2 z-[1200] w-[94%] max-w-2xl -translate-x-1/2 rounded-3xl border border-gray-200 bg-white/95 px-2 py-2 shadow-2xl">
        <div className="flex items-stretch gap-1 text-[10px] font-semibold">
          {bottomNavItems.map((item) => {
            const isActive = activeNav === item.action;
            return (
              <button
                key={item.id}
                type="button"
                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-center transition ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-pressed={isActive}
                onClick={() => handleBottomNav(item.action)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}