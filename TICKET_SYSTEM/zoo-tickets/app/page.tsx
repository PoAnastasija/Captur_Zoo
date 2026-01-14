'use client';

import { useState, useMemo } from 'react';
import { Ticket, TicketStatus, TicketCategory } from '@/types/tickets';
import { employees } from '@/components/data/employees';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, HelpCircle, Mail, Phone, Clock, Calendar, Paperclip, Users } from 'lucide-react';

// Données de démonstration
const mockTickets: Ticket[] = [
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
  {
    id: 'TKT-003',
    title: 'Support technique',
    description: 'Problème technique à résoudre',
    category: 'maintenance',
    priority: 'high',
    status: 'in-progress',
    createdBy: employees[1],
    assignedTo: employees[0],
    watchers: [],
    location: { zone: 'TT TIRAMISU' },
    createdAt: new Date('2025-12-23T14:00:00'),
    updatedAt: new Date('2025-12-23T14:30:00'),
    dueDate: new Date('2025-12-23T20:00:00'),
    attachments: [],
    comments: [],
    tags: [],
    metadata: {},
  },
  {
    id: 'TKT-004',
    title: 'Mise à jour du site',
    description: 'Demande de mise à jour',
    category: 'maintenance',
    priority: 'medium',
    status: 'in-progress',
    createdBy: employees[1],
    assignedTo: employees[0],
    watchers: [],
    location: { zone: 'SOCIETE DE CONSTRUCTIONS METALLIQUES' },
    createdAt: new Date('2025-12-19T11:00:00'),
    updatedAt: new Date('2025-12-19T11:30:00'),
    dueDate: new Date('2025-12-19T18:00:00'),
    attachments: [],
    comments: [],
    tags: [],
    metadata: {},
  },
  {
    id: 'TKT-005',
    title: 'Configuration serveur',
    description: 'Configuration nécessaire',
    category: 'maintenance',
    priority: 'low',
    status: 'in-progress',
    createdBy: employees[1],
    assignedTo: employees[0],
    watchers: [],
    location: { zone: 'AUBERGE DU MOULIN' },
    createdAt: new Date('2025-12-05T08:00:00'),
    updatedAt: new Date('2025-12-05T08:30:00'),
    dueDate: new Date('2025-12-05T16:00:00'),
    attachments: [],
    comments: [],
    tags: [],
    metadata: {},
  },
  {
    id: 'TKT-006',
    title: 'Optimisation performance',
    description: 'Amélioration des performances',
    category: 'maintenance',
    priority: 'medium',
    status: 'in-progress',
    createdBy: employees[1],
    assignedTo: employees[0],
    watchers: [],
    location: { zone: 'RTL CARROSSERIE INDUSTRIELLE' },
    createdAt: new Date('2025-12-19T13:00:00'),
    updatedAt: new Date('2025-12-19T13:30:00'),
    dueDate: new Date('2025-12-19T19:00:00'),
    attachments: [],
    comments: [],
    tags: [],
    metadata: {},
  },
];

export default function TicketsPage() {
  const [tickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'stats'>('list');
  const [statusTab, setStatusTab] = useState<'pending' | 'processed' | 'trash'>('processed');
  const [filterValue, setFilterValue] = useState('all');
  const [detailTab, setDetailTab] = useState<'details' | 'attachments' | 'team'>('details');

  const stats = useMemo(() => ({
    pending: 0,
    processed: 58,
    trash: 0,
  }), []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (statusTab === 'pending') return ticket.status === 'open';
      if (statusTab === 'processed') return ticket.status === 'in-progress' || ticket.status === 'resolved';
      if (statusTab === 'trash') return ticket.status === 'closed';
      return true;
    });
  }, [tickets, statusTab]);

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-2xl font-normal text-gray-700">Liste des tickets</h1>
            <HelpCircle className="w-5 h-5 text-gray-400" />
          </div>

          {/* Main Tabs */}
          <div className="flex gap-6 border-b">
            <button
              onClick={() => setActiveTab('new')}
              className={`pb-3 px-2 text-sm ${
                activeTab === 'new' 
                  ? 'text-gray-900 border-b-2 border-blue-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Nouveau ticket
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-3 px-2 text-sm ${
                activeTab === 'list' 
                  ? 'text-gray-900 border-b-2 border-blue-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Liste des tickets
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-3 px-2 text-sm ${
                activeTab === 'stats' 
                  ? 'text-gray-900 border-b-2 border-blue-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Statistiques
            </button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 py-3">
            <button
              onClick={() => setStatusTab('pending')}
              className={`px-4 py-2 text-sm rounded ${
                statusTab === 'pending'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              En attente ({stats.pending})
            </button>
            <button
              onClick={() => setStatusTab('processed')}
              className={`px-4 py-2 text-sm rounded ${
                statusTab === 'processed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Traités ({stats.processed})
            </button>
            <button
              onClick={() => setStatusTab('trash')}
              className={`px-4 py-2 text-sm rounded ${
                statusTab === 'trash'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Corbeille ({stats.trash})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Liste des tickets */}
        <div className={`${selectedTicket ? 'w-2/3' : 'w-full'} transition-all`}>
          {/* Info message */}
          <div className="mb-4 text-sm text-gray-600">
            Lorsqu'un ticket est sélectionné, vous pouvez naviguer avec les flèches du clavier. Appuyez sur <kbd className="px-2 py-1 bg-gray-200 rounded">Echap</kbd> pour fermer.
          </div>

          {/* Alert */}
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <span>⚠</span>
            <p>
              Attention, quand vous déléguez un ticket de source « Mail », un e-mail automatique est envoyé au professionnel dans le but de l'informer de la bonne prise en compte de sa demande.
            </p>
          </div>

          {/* Filter */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Filtres :</label>
            <Select value={filterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-normal w-12">Act...</th>
                  <th className="px-4 py-3 font-normal">Délégué à</th>
                  <th className="px-4 py-3 font-normal">Due Date</th>
                  <th className="px-4 py-3 font-normal">Entreprise</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => handleTicketClick(ticket)}
                    className={`border-b cursor-pointer hover:bg-blue-50 ${
                      selectedTicket?.id === ticket.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button className="text-gray-400 hover:text-gray-600">
                        •••
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gray-800 text-white text-sm">
                            {getInitials(ticket.createdBy.name)}
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gray-300 text-gray-600 text-sm">
                            {ticket.assignedTo ? getInitials(ticket.assignedTo.name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-600">{ticket.createdBy.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ticket.dueDate?.toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ticket.location?.zone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
              <span>Affichage des lignes 1 à 10 sur 58 lignes au total</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  defaultValue="10"
                  className="w-16 px-2 py-1 border rounded text-center"
                />
                <span>lignes par page</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popup de détail (slide-in from right) */}
        {selectedTicket && (
          <div className="w-1/3 bg-white rounded shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)] animate-slide-in-right">
            {/* Header avec fond */}
            <div 
              className="relative p-6 text-white"
              style={{
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h100v100H0z" fill="%23334155"/%3E%3C/svg%3E")',
                backgroundSize: 'cover',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    Entreprise : {selectedTicket.location?.zone}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">Indicent</Badge>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedTicket.metadata && (
                <div className="space-y-1 text-sm">
                  {selectedTicket.metadata.interlocuteur && (
                    <div className="flex items-center gap-2">
                      <span>Interlocuteur : 👤 {selectedTicket.metadata.interlocuteur}</span>
                    </div>
                  )}
                  {selectedTicket.metadata.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{selectedTicket.metadata.email}</span>
                    </div>
                  )}
                  {selectedTicket.metadata.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{selectedTicket.metadata.phone}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/20 text-sm space-y-1">
                <div>Créé par : 👤 {selectedTicket.assignedTo?.name || 'Non assigné'}</div>
                {selectedTicket.metadata?.url && (
                  <div>URL : {selectedTicket.metadata.url}</div>
                )}
                <div>Titre : {selectedTicket.title}</div>
                {selectedTicket.metadata?.source && (
                  <div>Source : {selectedTicket.metadata.source}</div>
                )}
              </div>

              {/* Time info en haut à droite */}
              <div className="absolute top-4 right-16 text-right text-sm">
                {selectedTicket.metadata?.timeEstimate && (
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Temps estimé : {selectedTicket.metadata.timeEstimate}</span>
                  </div>
                )}
                {selectedTicket.dueDate && (
                  <div className="flex items-center gap-1 justify-end">
                    <Calendar className="w-4 h-4" />
                    <span>Due Date : {selectedTicket.dueDate.toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setDetailTab('details')}
                className={`px-6 py-3 text-sm ${
                  detailTab === 'details'
                    ? 'bg-white border-b-2 border-blue-500 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Détails
              </button>
              <button
                onClick={() => setDetailTab('attachments')}
                className={`px-6 py-3 text-sm flex items-center gap-2 ${
                  detailTab === 'attachments'
                    ? 'bg-white border-b-2 border-blue-500 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Paperclip className="w-4 h-4" />
                Pièces jointes
                {selectedTicket.attachments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedTicket.attachments.length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setDetailTab('team')}
                className={`px-6 py-3 text-sm flex items-center gap-2 ${
                  detailTab === 'team'
                    ? 'bg-white border-b-2 border-blue-500 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Équipe
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'details' && (
                <div className="prose prose-sm max-w-none">
                  {selectedTicket.description.split('\n\n').map((paragraph, idx) => {
                    // Mettre en évidence les mots clés
                    const highlightedText = paragraph
                      .replace(/menu/gi, '<mark class="bg-yellow-200">menu</mark>')
                      .replace(/noël/gi, '<mark class="bg-yellow-200">noël</mark>');
                    
                    return (
                      <p 
                        key={idx} 
                        className="text-gray-700 mb-4"
                        dangerouslySetInnerHTML={{ __html: highlightedText }}
                      />
                    );
                  })}
                </div>
              )}

              {detailTab === 'attachments' && (
                <div className="space-y-2">
                  {selectedTicket.attachments.length > 0 ? (
                    selectedTicket.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                      >
                        <Paperclip className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{attachment.filename}</div>
                          <div className="text-xs text-gray-500">
                            {(attachment.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Télécharger
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">
                      Aucune pièce jointe
                    </p>
                  )}
                </div>
              )}

              {detailTab === 'team' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Créé par</div>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gray-800 text-white">
                          {getInitials(selectedTicket.createdBy.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{selectedTicket.createdBy.name}</div>
                        <div className="text-sm text-gray-500">{selectedTicket.createdBy.email}</div>
                      </div>
                    </div>
                  </div>

                  {selectedTicket.assignedTo && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Assigné à</div>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(selectedTicket.assignedTo.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedTicket.assignedTo.name}</div>
                          <div className="text-sm text-gray-500">{selectedTicket.assignedTo.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        mark {
          padding: 0 2px;
        }
      `}</style>
    </div>
  );
}