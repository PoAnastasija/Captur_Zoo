export type TicketStatus = 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 
  | 'animal-health'      // Santé animale
  | 'maintenance'        // Maintenance
  | 'safety'            // Sécurité
  | 'visitor-incident'  // Incident visiteur
  | 'blood-donation'    // Don du sang
  | 'supply'            // Approvisionnement
  | 'staff'             // Personnel
  | 'other';            // Autre

export type EmployeeRole = 'veterinarian' | 'keeper' | 'maintenance' | 'security' | 'admin' | 'manager';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string;
  avatar?: string;
  phone?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Personnes impliquées
  createdBy: Employee;
  assignedTo?: Employee;
  watchers: Employee[]; // Personnes qui suivent le ticket
  
  // Localisation
  location?: {
    animalId?: string;
    animalName?: string;
    enclosureName?: string;
    zone?: string;
  };
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  resolvedAt?: Date;
  
  // Contenu additionnel
  attachments: TicketAttachment[];
  comments: TicketComment[];
  tags: string[];
  
  // Champs spécifiques
  metadata?: {
    // Pour don du sang
    bloodType?: string;
    urgency?: string;
    quantity?: string;
    
    // Pour santé animale
    symptoms?: string[];
    temperature?: number;
    lastMeal?: Date;
    
    // Pour maintenance
    equipmentId?: string;
    estimatedCost?: number;
    
    // Pour incidents visiteurs
    visitorName?: string;
    injuryType?: string;
    emergencyServices?: boolean;
  };
}

export interface TicketAttachment {
  id: string;
  filename: string;
  url: string;
  type: string; // image, pdf, etc.
  size: number;
  uploadedBy: Employee;
  uploadedAt: Date;
}

export interface TicketComment {
  id: string;
  content: string;
  author: Employee;
  createdAt: Date;
  internal: boolean; // Commentaire visible uniquement par le staff
}

export interface TicketFilter {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  createdBy?: string;
  search?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface TicketTemplate {
  id: string;
  name: string;
  category: TicketCategory;
  priority: TicketPriority;
  titleTemplate: string;
  descriptionTemplate: string;
  defaultAssignee?: EmployeeRole;
  requiredFields: string[];
}