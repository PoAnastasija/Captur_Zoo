import { Ticket } from '@/types/tickets'
import { employees } from './employees'

export const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    title: 'Modification technique',
    description: 'Bonjour,\n\nPourriez-vous ajouter en pop-up le menu de noël que je vous joins pour le 24 et 25 décembre, tout en précisant que celui-ci sera un menu unique.\n\nAussi, nous fermerons le restaurant à partir du 30 décembre jusqu\'au 2 janvier inclus, merci de le mentionner.',
    category: 'maintenance',
    priority: 'medium',
    status: 'in-progress',
    createdBy: employees[1],
    assignedTo: employees[0],
    watchers: [],
    location: { zone: 'TT TIRAMISU' },
    createdAt: new Date('2025-12-23T10:00:00'),
    updatedAt: new Date('2025-12-23T10:30:00'),
    dueDate: new Date('2025-12-23T18:00:00'),
    attachments: [
      { id: 'att-1', filename: 'menu-noel.pdf', url: '', type: 'pdf', size: 1024000, uploadedBy: employees[1], uploadedAt: new Date() },
      { id: 'att-2', filename: 'photo-plat.jpg', url: '', type: 'image', size: 512000, uploadedBy: employees[1], uploadedAt: new Date() },
    ],
    comments: [],
    tags: [],
    metadata: {
      interlocuteur: 'Tina NAZARYAN',
      email: 'tinashirv@gmail.com',
      phone: '01 81 81 70 71',
      url: 'https://www.tthistoirerestaurant.com',
      source: 'Mail',
      timeEstimate: '00:00',
    },
  },
  {
    id: 'TKT-002',
    title: 'Demande de modification',
    description: 'Modification du menu',
    category: 'maintenance',
    priority: 'medium',
    status: 'in-progress',
    createdBy: employees[1],
    assignedTo: employees[0],
    watchers: [],
    location: { zone: 'ALEXANDRE TRUPIANO' },
    createdAt: new Date('2025-12-24T09:00:00'),
    updatedAt: new Date('2025-12-24T09:30:00'),
    dueDate: new Date('2025-12-24T17:00:00'),
    attachments: [],
    comments: [],
    tags: [],
    metadata: {},
  },
  // (additional tickets shortened for brevity) - you can expand as needed
]

export default mockTickets
