'use client';

import { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types/tickets';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, AlertCircle, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TicketListProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

const statusConfig: Record<TicketStatus, { label: string; color: string }> = {
  'open': { label: 'Ouvert', color: 'bg-blue-500' },
  'in-progress': { label: 'En cours', color: 'bg-yellow-500' },
  'waiting': { label: 'En attente', color: 'bg-orange-500' },
  'resolved': { label: 'Résolu', color: 'bg-green-500' },
  'closed': { label: 'Fermé', color: 'bg-gray-500' },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string; icon: string }> = {
  'low': { label: 'Faible', color: 'bg-gray-100 text-gray-800', icon: '○' },
  'medium': { label: 'Moyenne', color: 'bg-blue-100 text-blue-800', icon: '◐' },
  'high': { label: 'Haute', color: 'bg-orange-100 text-orange-800', icon: '◉' },
  'urgent': { label: 'Urgente', color: 'bg-red-100 text-red-800', icon: '⚠' },
};

const categoryConfig: Record<string, { label: string; emoji: string }> = {
  'animal-health': { label: 'Santé animale', emoji: '🏥' },
  'maintenance': { label: 'Maintenance', emoji: '🔧' },
  'safety': { label: 'Sécurité', emoji: '🛡️' },
  'visitor-incident': { label: 'Incident visiteur', emoji: '🚨' },
  'blood-donation': { label: 'Don du sang', emoji: '🩸' },
  'supply': { label: 'Approvisionnement', emoji: '📦' },
  'staff': { label: 'Personnel', emoji: '👥' },
  'other': { label: 'Autre', emoji: '📋' },
};

export default function TicketList({ tickets, onTicketClick }: TicketListProps) {
  return (
    <div className="space-y-3">
      {tickets.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Aucun ticket à afficher</p>
        </Card>
      ) : (
        tickets.map((ticket) => {
          const status = statusConfig[ticket.status];
          const priority = priorityConfig[ticket.priority];
          const category = categoryConfig[ticket.category];

          return (
            <Card
              key={ticket.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-all hover:border-green-500"
              onClick={() => onTicketClick(ticket)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Catégorie */}
                  <div className="text-2xl">{category.emoji}</div>
                  
                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {ticket.title}
                      </h3>
                      <span className="text-xs text-gray-500">#{ticket.id}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {ticket.description}
                    </p>

                    {/* Localisation si présente */}
                    {ticket.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <span>📍</span>
                        {ticket.location.animalName && (
                          <span>{ticket.location.animalName}</span>
                        )}
                        {ticket.location.enclosureName && (
                          <span>· {ticket.location.enclosureName}</span>
                        )}
                        {ticket.location.zone && (
                          <span>· {ticket.location.zone}</span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {/* Priorité */}
                      <Badge className={`${priority.color} text-xs`}>
                        {priority.icon} {priority.label}
                      </Badge>

                      {/* Statut */}
                      <Badge className="text-xs" variant="outline">
                        <div className={`w-2 h-2 rounded-full ${status.color} mr-1`} />
                        {status.label}
                      </Badge>

                      {/* Catégorie */}
                      <Badge variant="outline" className="text-xs">
                        {category.label}
                      </Badge>

                      {/* Tags personnalisés */}
                      {ticket.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <div className="flex items-center gap-4">
                  {/* Créé par */}
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{ticket.createdBy.name}</span>
                  </div>

                  {/* Date de création */}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(ticket.createdAt, {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {/* Date d'échéance si présente */}
                  {ticket.dueDate && (
                    <div className={`flex items-center gap-1 ${
                      ticket.dueDate < new Date() ? 'text-red-600 font-medium' : ''
                    }`}>
                      <Calendar className="w-3 h-3" />
                      <span>
                        Échéance {formatDistanceToNow(ticket.dueDate, { locale: fr })}
                      </span>
                    </div>
                  )}

                  {/* Nombre de commentaires */}
                  {ticket.comments.length > 0 && (
                    <span>💬 {ticket.comments.length}</span>
                  )}
                </div>

                {/* Assigné à */}
                {ticket.assignedTo && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Assigné à</span>
                    <div className="flex items-center gap-1">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-green-600 text-white">
                          {ticket.assignedTo.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{ticket.assignedTo.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}