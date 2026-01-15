// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import Image from 'next/image';
// import { Animal } from '@/app/types/zoo';
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { getAuthToken } from '@/components/ui/AuthButton';

// interface ZoodexPanelProps {
//   animals: Animal[];
//   capturedAnimals: string[];
//   capturedEnclosures: string[];
//   open: boolean;
//   onClose: () => void;
// }

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost';
// const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT;

// interface RemoteAnimal {
//   name: string;
//   latitude: number;
//   longitude: number;
//   image: string | null;
//   icon?: string | null;
//   type?: string;
//   unlocked?: boolean;
// }

// interface GalleryCard {
//   id: string;
//   name: string;
//   image: string;
//   captured: boolean;
//   detailSource?: Animal;
//   icon?: string | null;
// }

// const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300?text=Animal';

// export function ZoodexPanel({
//   animals,
//   capturedAnimals,
//   capturedEnclosures,
//   open,
//   onClose,
// }: ZoodexPanelProps) {
//   const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
//   const [remoteAnimals, setRemoteAnimals] = useState<RemoteAnimal[] | null>(null);
//   const [remoteLoading, setRemoteLoading] = useState(false);
//   const [remoteError, setRemoteError] = useState<string | null>(null);
//   const [authRequired, setAuthRequired] = useState(false);

//   const uniqueAnimals = useMemo(
//     () => Array.from(new Map(animals.map((animal) => [animal.id, animal])).values()),
//     [animals]
//   );
//   const capturedSet = useMemo(() => new Set([...capturedAnimals, ...capturedEnclosures]), [capturedAnimals, capturedEnclosures]);
//   const fallbackGallery = useMemo<GalleryCard[]>(() => {
//     return uniqueAnimals.slice(0, 3).map((animal) => ({
//       id: animal.id,
//       name: animal.name,
//       image: animal.image,
//       captured: capturedSet.has(animal.id),
//       detailSource: animal,
//     }));
//   }, [capturedSet, uniqueAnimals]);

//   const handleAnimalClick = (animal: Animal) => {
//     setSelectedAnimal(animal);
//   };

//   const remoteGallery = useMemo<GalleryCard[] | null>(() => {
//     if (!remoteAnimals || remoteAnimals.length === 0) {
//       return null;
//     }
//     return remoteAnimals.map((animal, index) => ({
//       id: `remote-${index}-${animal.name}`,
//       name: animal.name,
//       image: animal.image ?? PLACEHOLDER_IMAGE,
//       captured: Boolean(animal.unlocked),
//       icon: animal.icon ?? null,
//     }));
//   }, [remoteAnimals]);

//   const stats = useMemo(() => {
//     const source = remoteGallery && remoteGallery.length > 0 ? remoteGallery : fallbackGallery;
//     const capturedCount = source.filter((animal) => animal.captured).length;
//     return {
//       captured: capturedCount,
//       total: source.length,
//     };
//   }, [fallbackGallery, remoteGallery]);

//   const displayCards = remoteGallery && remoteGallery.length > 0 ? remoteGallery : fallbackGallery;

//   useEffect(() => {
//     if (!open) {
//       return;
//     }

//     const token = getAuthToken();
//     if (!token) {
//       setAuthRequired(true);
//       setRemoteAnimals(null);
//       setRemoteLoading(false);
//       return;
//     }

//     const controller = new AbortController();
//     setAuthRequired(false);
//     setRemoteLoading(true);
//     setRemoteError(null);

//     const fetchUserAnimals = async () => {
//       try {
//         const baseUrl = BACKEND_PORT ? `${BACKEND_URL}:${BACKEND_PORT}` : BACKEND_URL;
//         const response = await fetch(`${baseUrl}/api/user/animals`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           signal: controller.signal,
//         });

//         if (!response.ok) {
//           if (response.status === 401) {
//             setAuthRequired(true);
//             setRemoteAnimals(null);
//           }
//           const errorData = await response.json().catch(() => ({}));
//           throw new Error(errorData.message || `Erreur ${response.status}`);
//         }

//         const data = await response.json();
//         if (!Array.isArray(data)) {
//           throw new Error('Réponse inattendue du serveur');
//         }
//         setRemoteAnimals(data as RemoteAnimal[]);
//       } catch (error) {
//         if ((error as Error).name === 'AbortError') {
//           return;
//         }
//         setRemoteError(error instanceof Error ? error.message : 'Une erreur est survenue');
//       } finally {
//         setRemoteLoading(false);
//       }
//     };

//     fetchUserAnimals();

//     return () => controller.abort();
//   }, [open]);

//   const isCaptured = selectedAnimal ? capturedSet.has(selectedAnimal.id) : false;

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent
//         showCloseButton={false}
//         className="inset-0 left-0 top-0 h-screen max-h-screen w-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-linear-to-b from-[#fdf5e3] via-[#fbedd2] to-[#f9e1b7] p-0"
//       >
//         <div className="flex h-full min-h-0 flex-col overflow-hidden">
//           <div className="flex items-center justify-between border-b border-white/40 px-4 py-4 sm:px-6">
//             <div>
//               <DialogTitle className="text-3xl font-bold text-[#1f2a24]">Galerie des animaux</DialogTitle>
//               <DialogDescription className="text-[#4a5a51]">
//                 Découvre les animaux du zoo et débloque-les en les photographiant.
//               </DialogDescription>
//             </div>
//             <DialogClose asChild>
//               <button
//                 type="button"
//                 className="rounded-full border border-[#d2c4ab] px-4 py-2 text-xs font-semibold text-[#4c3c2c] transition hover:bg-white/60"
//               >
//                 Fermer
//               </button>
//             </DialogClose>
//           </div>
//           <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
//             <div className="mb-4 rounded-lg border border-white/60 bg-white/80 p-4 shadow-sm">
//               <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#0d4f4a]">Animaux capturés</p>
//               <p className="mt-2 text-3xl font-bold text-[#1d2c27]">{stats.captured} / {stats.total}</p>
//             </div>
//             {authRequired && (
//               <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
//                 Connecte-toi pour synchroniser ta progression et ta galerie personnalisée.
//               </div>
//             )}
//             {remoteError && (
//               <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//                 {remoteError}
//               </div>
//             )}
//             {remoteLoading && (
//               <div className="mb-4 rounded-lg border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#1f2a24]">
//                 Chargement de ta galerie...
//               </div>
//             )}
//             <div className="w-full rounded-lg p-3 sm:p-4 md:p-6">
//               <div className="space-y-3 sm:space-y-4 md:space-y-5">
//                 {displayCards.map((card) => {
//                   const captured = card.captured;
//                   const isInteractive = Boolean(card.detailSource);
//                   const assetSrc = captured ? card.image : card.icon ?? card.image;
//                   const assetAlt = captured ? card.name : `Icône ${card.name}`;
//                   const shouldDesaturate = !captured && !card.icon;
//                   return (
//                     <button
//                       key={card.id}
//                       type="button"
//                       onClick={() => card.detailSource && handleAnimalClick(card.detailSource)}
//                       disabled={!isInteractive}
//                       className={`w-full flex overflow-hidden bg-white/80 border border-white/60 rounded-3xl shadow-sm text-left h-32 sm:h-40 transition-all duration-200 ${
//                         isInteractive ? 'hover:bg-white/95 hover:shadow-md hover:scale-105 active:scale-95' : 'opacity-90 cursor-default'
//                       }`}
//                     >
//                       {/* Image - Left side with 100% height */}
//                       <div className={`relative w-32 sm:w-40 flex-shrink-0 ${captured ? 'bg-white' : 'bg-gray-100'}`}>
//                         <Image
//                           src={assetSrc}
//                           alt={assetAlt}
//                           fill
//                             className={`object-cover transition-all ${shouldDesaturate ? 'grayscale opacity-70' : ''}`}
//                           sizes="(max-width: 640px) 128px, 160px"
//                         />
//                       </div>

//                       {/* Info - Right side */}
//                       <div className="flex-1 flex flex-col gap-2 sm:gap-3 justify-center p-4 sm:p-5">
//                         <div>
//                           <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#1f2a24] line-clamp-1">
//                             {card.name}
//                           </h3>
//                         </div>

//                         {/* Capture Status */}
//                         <div className="flex gap-2 flex-wrap">
//                           <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
//                             captured ? 'bg-[#e1f6d9] text-[#1d6432]' : 'bg-[#fff1d9] text-[#8a4b12]'
//                           }`}>
//                             <span className={`w-2 h-2 rounded-full ${captured ? 'bg-[#1d6432]' : 'bg-[#8a4b12]'}`} />
//                             {captured ? 'Capturé' : 'Non capturé'}
//                           </span>
//                         </div>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>

//             {selectedAnimal && (
//               <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
//                 <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
//                   <div className="space-y-4">
//                     <div className="relative w-full h-48 sm:h-72 rounded-lg overflow-hidden bg-gray-100">
//                       <Image
//                         src={selectedAnimal.image}
//                         alt={selectedAnimal.name}
//                         fill
//                         className={`object-contain p-4 transition-all ${isCaptured ? '' : 'grayscale opacity-70'}`}
//                         sizes="500px"
//                       />
//                     </div>

//                     <div className="space-y-3">
//                       <div>
//                         <h2 className="text-2xl sm:text-3xl font-bold">{selectedAnimal.name}</h2>
//                         <p className="text-sm text-gray-600">{selectedAnimal.species}</p>
//                         <p className="text-xs text-gray-500 mt-1">{selectedAnimal.zoneName}</p>
//                       </div>

//                       <div className={`p-3 rounded-lg ${isCaptured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
//                         <p className="font-semibold text-sm">{isCaptured ? '✓ Animal débloqué' : 'Non débloqué - Photographie cet animal'}</p>
//                       </div>

//                       {selectedAnimal.description && (
//                         <div>
//                           <h3 className="font-semibold text-sm mb-1">À propos</h3>
//                           <p className="text-sm text-gray-700">{selectedAnimal.description}</p>
//                         </div>
//                       )}

//                       {selectedAnimal.funFact && (
//                         <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
//                           <h3 className="font-semibold text-sm mb-1">🐾 L'engagement du zoo</h3>
//                           <p className="text-sm text-blue-900">{selectedAnimal.funFact}</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </DialogContent>
//               </Dialog>
//             )}
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Animal } from '@/app/types/zoo';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAuthToken } from '@/components/ui/AuthButton';

interface ZoodexPanelProps {
  animals: Animal[];
  capturedAnimals: string[];
  capturedEnclosures: string[];
  open: boolean;
  onClose: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost';
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT;

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

interface RemoteAnimal {
  name: string;
  latitude: number;
  longitude: number;
  image: string | null;
  icon?: string | null;
  type?: string;
  unlocked?: boolean;
}

interface GalleryCard {
  id: string;
  name: string;
  image: string;
  captured: boolean;
  detailSource?: Animal;
  icon?: string | null;
}

// Interface pour les questions de quiz
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Animaux éligibles au quiz (matcher sur le nom affiché)
const QUIZ_ANIMALS = ['ours polaires', 'polar bear', 'loups à crinière', 'maned wolf', 'cercopithèques', 'cercopitheques'];

// Questions de quiz (communes aux animaux supportés)
const ANIMAL_QUIZ: QuizQuestion[] = [
  {
    question: "Quelle est la nourriture préférée des ours polaires dans la nature ?",
    options: [
      "Le poisson et les fruits",
      "Les phoques annelés et barbus",
      "Les pingouins",
      "Les algues"
    ],
    correctAnswer: 1,
    explanation: "Dans la nature, les ours polaires chassent principalement les phoques annelés et barbus sur la banquise."
  },
  {
    question: "Combien de temps dure l'allaitement d'un ourson polaire ?",
    options: [
      "6 mois",
      "1 an",
      "Environ 2 ans",
      "3 mois"
    ],
    correctAnswer: 2,
    explanation: "L'allaitement dure environ deux ans, une période cruciale pour le développement de l'ourson."
  },
  {
    question: "Quel est le poids approximatif d'un ourson polaire à la naissance ?",
    options: [
      "10 kg",
      "5 kg",
      "600 grammes",
      "2 kg"
    ],
    correctAnswer: 2,
    explanation: "Un ourson polaire ne pèse qu'environ 600 grammes à la naissance, soit moins qu'un chiot !"
  }
];

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300?text=Animal';

export function ZoodexPanel({
  animals,
  capturedAnimals,
  capturedEnclosures,
  open,
  onClose,
}: ZoodexPanelProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [remoteAnimals, setRemoteAnimals] = useState<RemoteAnimal[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [canDisplayGallery, setCanDisplayGallery] = useState(false);

  // États pour le quiz
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const uniqueAnimals = useMemo(
    () => Array.from(new Map(animals.map((animal) => [animal.id, animal])).values()),
    [animals]
  );
  const capturedSet = useMemo(() => new Set([...capturedAnimals, ...capturedEnclosures]), [capturedAnimals, capturedEnclosures]);
  const fallbackGallery = useMemo<GalleryCard[]>(() => {
    return uniqueAnimals.slice(0, 3).map((animal) => ({
      id: animal.id,
      name: animal.name,
      image: animal.image,
      captured: capturedSet.has(animal.id),
      detailSource: animal,
    }));
  }, [capturedSet, uniqueAnimals]);

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
    // Réinitialiser le quiz
    setShowQuiz(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const remoteGallery = useMemo<GalleryCard[] | null>(() => {
    if (!remoteAnimals || remoteAnimals.length === 0) {
      return null;
    }

    const normalizedAnimalsMap = uniqueAnimals.reduce<Record<string, Animal>>((acc, animal) => {
      acc[normalizeName(animal.name)] = animal;
      return acc;
    }, {});

    return remoteAnimals.map((animal, index) => {
      const detailSource = normalizedAnimalsMap[normalizeName(animal.name)];
      return {
        id: `remote-${index}-${animal.name}`,
        name: animal.name,
        image: animal.image ?? PLACEHOLDER_IMAGE,
        captured: Boolean(animal.unlocked),
        icon: animal.icon ?? null,
        detailSource,
      };
    });
  }, [remoteAnimals, uniqueAnimals]);

  const stats = useMemo(() => {
    if (!canDisplayGallery) {
      return { captured: 0, total: 0 };
    }
    const source = remoteGallery && remoteGallery.length > 0 ? remoteGallery : fallbackGallery;
    const capturedCount = source.filter((animal) => animal.captured).length;
    return {
      captured: capturedCount,
      total: source.length,
    };
  }, [canDisplayGallery, fallbackGallery, remoteGallery]);

  const displayCards = canDisplayGallery
    ? remoteGallery && remoteGallery.length > 0
      ? remoteGallery
      : fallbackGallery
    : [];

  useEffect(() => {
    if (!open) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setAuthRequired(true);
      setRemoteAnimals(null);
      setRemoteLoading(false);
      setCanDisplayGallery(false);
      return;
    }

    const controller = new AbortController();
    setAuthRequired(false);
    setCanDisplayGallery(true);
    setRemoteLoading(true);
    setRemoteError(null);

    const fetchUserAnimals = async () => {
      try {
        const baseUrl = BACKEND_PORT ? `${BACKEND_URL}:${BACKEND_PORT}` : BACKEND_URL;
        const response = await fetch(`${baseUrl}/api/user/animals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            setAuthRequired(true);
            setRemoteAnimals(null);
            setCanDisplayGallery(false);
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erreur ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Réponse inattendue du serveur');
        }
        setRemoteAnimals(data as RemoteAnimal[]);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        setRemoteError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setRemoteLoading(false);
      }
    };

    fetchUserAnimals();

    return () => controller.abort();
  }, [open]);

  const isCaptured = selectedAnimal ? capturedSet.has(selectedAnimal.id) : false;

  // Vérifier si l'animal sélectionné est un ours polaire
  const isQuizAnimal = selectedAnimal
    ? QUIZ_ANIMALS.some((name) => selectedAnimal.name.toLowerCase().includes(name))
    : false;

  // Fonctions pour gérer le quiz
  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleValidateAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === ANIMAL_QUIZ[currentQuestion].correctAnswer;
    if (isCorrect) {
      setQuizScore(quizScore + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < ANIMAL_QUIZ.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizCompleted(false);
    setShowQuiz(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-screen max-h-screen w-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-linear-to-b from-[#fdf5e3] via-[#fbedd2] to-[#f9e1b7] p-0"
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/40 px-4 py-4 sm:px-6">
            <div>
              <DialogTitle className="text-3xl font-bold text-[#1f2a24]">Galerie des animaux</DialogTitle>
              <DialogDescription className="text-[#4a5a51]">
                Découvre les animaux du zoo et débloque-les en les photographiant.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-[#d2c4ab] px-4 py-2 text-xs font-semibold text-[#4c3c2c] transition hover:bg-white/60"
              >
                Fermer
              </button>
            </DialogClose>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
            {canDisplayGallery && (
              <div className="mb-4 rounded-lg border border-white/60 bg-white/80 p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#0d4f4a]">Animaux capturés</p>
                <p className="mt-2 text-3xl font-bold text-[#1d2c27]">{stats.captured} / {stats.total}</p>
              </div>
            )}
            {remoteError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {remoteError}
              </div>
            )}
            {remoteLoading && (
              <div className="mb-4 rounded-lg border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#1f2a24]">
                Chargement de ta galerie...
              </div>
            )}
            {canDisplayGallery ? (
              <div className="w-full rounded-lg p-3 sm:p-4 md:p-6">
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  {displayCards.map((card) => {
                    const captured = card.captured;
                    const isInteractive = Boolean(card.detailSource);
                    const assetSrc = captured ? card.image : card.icon ?? card.image;
                    const assetAlt = captured ? card.name : `Icône ${card.name}`;
                    const shouldDesaturate = !captured && !card.icon;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => card.detailSource && handleAnimalClick(card.detailSource)}
                        disabled={!isInteractive}
                        className={`w-full flex overflow-hidden bg-white/80 border border-white/60 rounded-3xl shadow-sm text-left h-32 sm:h-40 transition-all duration-200 ${
                          isInteractive ? 'hover:bg-white/95 hover:shadow-md hover:scale-105 active:scale-95' : 'opacity-90 cursor-default'
                        }`}
                      >
                        {/* Image - Left side with 100% height */}
                        <div className={`relative w-32 sm:w-40 flex-shrink-0 ${captured ? 'bg-white' : 'bg-gray-100'}`}>
                          <Image
                            src={assetSrc}
                            alt={assetAlt}
                            fill
                            className={`object-cover transition-all ${shouldDesaturate ? 'grayscale opacity-70' : ''}`}
                            sizes="(max-width: 640px) 128px, 160px"
                          />
                        </div>

                        {/* Info - Right side */}
                        <div className="flex-1 flex flex-col gap-2 sm:gap-3 justify-center p-4 sm:p-5">
                          <div>
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#1f2a24] line-clamp-1">
                              {card.name}
                            </h3>
                          </div>

                          {/* Capture Status */}
                          <div className="flex gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                              captured ? 'bg-[#e1f6d9] text-[#1d6432]' : 'bg-[#fff1d9] text-[#8a4b12]'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${captured ? 'bg-[#1d6432]' : 'bg-[#8a4b12]'}`} />
                              {captured ? 'Capturé' : 'Non capturé'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/60 bg-white/80 p-6 text-center text-sm text-[#1f2a24]">
                Connecte-toi pour afficher les animaux disponibles et suivre ta progression.
              </div>
            )}

            {selectedAnimal && (
              <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
                <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="space-y-4">
                    <div className="relative w-full h-48 sm:h-72 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={selectedAnimal.image}
                        alt={selectedAnimal.name}
                        fill
                        className={`object-contain p-4 transition-all ${isCaptured ? '' : 'grayscale opacity-70'}`}
                        sizes="500px"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <DialogTitle className="text-2xl sm:text-3xl font-bold">
                          {selectedAnimal.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600">
                          {selectedAnimal.species}
                        </DialogDescription>
                        <p className="text-xs text-gray-500 mt-1">{selectedAnimal.zoneName}</p>
                      </div>

                      <div className={`p-3 rounded-lg ${isCaptured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        <p className="font-semibold text-sm">{isCaptured ? '✓ Animal débloqué' : 'Non débloqué - Photographie cet animal'}</p>
                      </div>

                      {selectedAnimal.description && (
                        <div>
                          <h3 className="font-semibold text-sm mb-1">À propos</h3>
                          <p className="text-sm text-gray-700">{selectedAnimal.description}</p>
                        </div>
                      )}

                      {selectedAnimal.funFact && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <h3 className="font-semibold text-sm mb-1">🐾 L'engagement du zoo</h3>
                          <p className="text-sm text-blue-900">{selectedAnimal.funFact}</p>
                        </div>
                      )}

                      {/* Bouton Quiz pour l'ours polaire */}
                      {isQuizAnimal && !showQuiz && (
                        <button
                          onClick={() => setShowQuiz(true)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">🧠</span>
                          <span>Teste tes connaissances !</span>
                        </button>
                      )}

                      {/* Section Quiz */}
                      {isQuizAnimal && showQuiz && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border-2 border-blue-200 shadow-lg">
                          {!quizCompleted ? (
                            <>
                              {/* Progress bar */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-semibold text-blue-700">
                                    Question {currentQuestion + 1}/{ANIMAL_QUIZ.length}
                                  </span>
                                  <span className="text-xs font-semibold text-blue-700">
                                    Score: {quizScore}/{ANIMAL_QUIZ.length}
                                  </span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((currentQuestion + 1) / ANIMAL_QUIZ.length) * 100}%` }}
                                  />
                                </div>
                              </div>

                              {/* Question */}
                              <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-4">
                                {ANIMAL_QUIZ[currentQuestion].question}
                              </h3>

                              {/* Options */}
                              <div className="space-y-2 mb-4">
                                {ANIMAL_QUIZ[currentQuestion].options.map((option, index) => {
                                  const isSelected = selectedAnswer === index;
                                  const isCorrect = index === ANIMAL_QUIZ[currentQuestion].correctAnswer;
                                  const showResult = showExplanation;

                                  return (
                                    <button
                                      key={index}
                                      onClick={() => handleAnswerSelect(index)}
                                      disabled={showExplanation}
                                      className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                                        showResult
                                          ? isCorrect
                                            ? 'bg-green-100 border-green-500 text-green-900'
                                            : isSelected
                                            ? 'bg-red-100 border-red-500 text-red-900'
                                            : 'bg-white border-gray-200 text-gray-600'
                                          : isSelected
                                          ? 'bg-blue-100 border-blue-500 text-blue-900'
                                          : 'bg-white border-gray-300 text-gray-800 hover:border-blue-400 hover:bg-blue-50'
                                      }`}
                                    >
                                      <span className="text-sm font-medium">{option}</span>
                                      {showResult && isCorrect && <span className="float-right">✓</span>}
                                      {showResult && isSelected && !isCorrect && <span className="float-right">✗</span>}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Explanation */}
                              {showExplanation && (
                                <div className="bg-white p-3 rounded-lg border border-blue-200 mb-4">
                                  <p className="text-sm text-gray-700">
                                    <span className="font-semibold">💡 Explication : </span>
                                    {ANIMAL_QUIZ[currentQuestion].explanation}
                                  </p>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2">
                                {!showExplanation ? (
                                  <button
                                    onClick={handleValidateAnswer}
                                    disabled={selectedAnswer === null}
                                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                                      selectedAnswer !== null
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    Valider
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleNextQuestion}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all"
                                  >
                                    {currentQuestion < ANIMAL_QUIZ.length - 1 ? 'Question suivante →' : 'Voir le résultat'}
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            /* Quiz Completed */
                            <div className="text-center space-y-4">
                              <div className="text-6xl">
                                {quizScore === ANIMAL_QUIZ.length ? '🏆' : quizScore >= 2 ? '🎉' : '📚'}
                              </div>
                              <h3 className="text-2xl font-bold text-gray-800">
                                Quiz terminé !
                              </h3>
                              <p className="text-lg font-semibold text-blue-700">
                                Tu as obtenu {quizScore}/{ANIMAL_QUIZ.length}
                              </p>
                              <p className="text-sm text-gray-600">
                                {quizScore === ANIMAL_QUIZ.length
                                  ? 'Parfait ! Tu es un vrai expert de l\'ours polaire ! 🐻‍❄️'
                                  : quizScore >= 2
                                  ? 'Bravo ! Tu connais bien les ours polaires !'
                                  : 'Continue d\'apprendre sur ces magnifiques animaux !'}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={resetQuiz}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all"
                                >
                                  Recommencer
                                </button>
                                <button
                                  onClick={() => setShowQuiz(false)}
                                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-all"
                                >
                                  Fermer
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}