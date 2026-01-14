import { TicketTemplate } from '@/types/tickets';

export const ticketTemplates: TicketTemplate[] = [
  {
    id: 'tpl-blood-donation',
    name: 'Don du sang urgent',
    category: 'blood-donation',
    priority: 'urgent',
    titleTemplate: 'Don du sang requis - [Animal]',
    descriptionTemplate: `Demande urgente de don du sang pour :

Animal : [Nom de l'animal]
Groupe sanguin : [Type]
Quantité nécessaire : [Volume en ml]
Urgence : [Immédiate/24h/48h]
Raison : [Chirurgie/Anémie/Autre]

Contact vétérinaire : [Nom]
Téléphone d'urgence : [Numéro]

Instructions spéciales :
[Détails supplémentaires]`,
    defaultAssignee: 'veterinarian',
    requiredFields: ['bloodType', 'quantity', 'urgency'],
  },
  {
    id: 'tpl-animal-health',
    name: 'Problème de santé animal',
    category: 'animal-health',
    priority: 'high',
    titleTemplate: 'Santé - [Animal] - [Symptôme]',
    descriptionTemplate: `Observation d'un problème de santé :

Animal concerné : [Nom]
Enclos : [Nom de l'enclos]
Symptômes observés : [Liste]
Comportement : [Description]
Température : [°C]
Dernier repas : [Date/Heure]

Observé par : [Nom du soigneur]
Actions déjà entreprises : [Description]`,
    defaultAssignee: 'veterinarian',
    requiredFields: ['symptoms', 'animalName'],
  },
  {
    id: 'tpl-maintenance',
    name: 'Demande de maintenance',
    category: 'maintenance',
    priority: 'medium',
    titleTemplate: 'Maintenance - [Équipement/Zone]',
    descriptionTemplate: `Demande de maintenance :

Localisation : [Zone/Enclos]
Équipement concerné : [Description]
Problème constaté : [Description détaillée]
Urgence : [Oui/Non]
Impact visiteurs : [Oui/Non]

Date de constatation : [Date]
Risques identifiés : [Description]`,
    defaultAssignee: 'maintenance',
    requiredFields: ['location', 'equipmentId'],
  },
  {
    id: 'tpl-visitor-incident',
    name: 'Incident visiteur',
    category: 'visitor-incident',
    priority: 'high',
    titleTemplate: 'Incident visiteur - [Type]',
    descriptionTemplate: `Incident impliquant un visiteur :

Type d'incident : [Chute/Malaise/Blessure/Autre]
Localisation : [Zone précise]
Heure : [HH:MM]

Visiteur :
- Nom : [Si disponible]
- Âge approximatif : [Âge]
- Blessures : [Description]

Secours appelés : [Oui/Non]
Témoins : [Nombre/Noms]
Actions entreprises : [Description]

Personnel présent : [Noms]`,
    defaultAssignee: 'security',
    requiredFields: ['injuryType', 'emergencyServices'],
  },
  {
    id: 'tpl-supply',
    name: 'Demande d\'approvisionnement',
    category: 'supply',
    priority: 'low',
    titleTemplate: 'Approvisionnement - [Article]',
    descriptionTemplate: `Demande d'approvisionnement :

Article(s) nécessaire(s) : [Liste]
Quantité : [Nombre]
Fournisseur habituel : [Nom]
Budget estimé : [Montant]

Usage prévu : [Description]
Date souhaitée : [Date]
Urgence : [Normale/Rapide]

Service demandeur : [Nom du service]`,
    requiredFields: ['description', 'estimatedCost'],
  },
];