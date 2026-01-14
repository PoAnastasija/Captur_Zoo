import { prisma } from './prisma'
import { Ticket, Employee } from '@/types/tickets'

function normalizeTicket(t: any): Ticket {
  const ticket: any = { ...t }
  try {
    ticket.metadata = typeof t.metadata === 'string' && t.metadata ? JSON.parse(t.metadata) : (t.metadata ?? {})
  } catch (e) {
    ticket.metadata = {}
  }
  try {
    ticket.location = typeof t.location === 'string' && t.location ? JSON.parse(t.location) : (t.location ?? null)
  } catch (e) {
    ticket.location = null
  }
  ticket.tags = typeof t.tags === 'string' && t.tags ? t.tags.split(',').filter(Boolean) : (t.tags ?? [])
  // ensure date fields are Date instances
  if (typeof ticket.createdAt === 'string') ticket.createdAt = new Date(ticket.createdAt)
  if (typeof ticket.updatedAt === 'string') ticket.updatedAt = new Date(ticket.updatedAt)
  if (typeof ticket.dueDate === 'string') ticket.dueDate = new Date(ticket.dueDate)
  if (typeof ticket.resolvedAt === 'string') ticket.resolvedAt = new Date(ticket.resolvedAt)
  if (Array.isArray(ticket.attachments)) {
    ticket.attachments = ticket.attachments.map((a: any) => ({ ...a, uploadedAt: typeof a.uploadedAt === 'string' ? new Date(a.uploadedAt) : a.uploadedAt }))
  }
  if (Array.isArray(ticket.comments)) {
    ticket.comments = ticket.comments.map((c: any) => ({ ...c, createdAt: typeof c.createdAt === 'string' ? new Date(c.createdAt) : c.createdAt }))
  }
  return ticket as Ticket
}

export async function init() {
  // Prisma will handle DB init/migrations externally. noop here.
  return
}

export async function getTickets(): Promise<Ticket[]> {
  const tickets = await prisma.ticket.findMany({
    include: {
      createdBy: true,
      assignedTo: true,
      attachments: { include: { uploadedBy: true } },
      comments: { include: { author: true } },
    }
  })
  return tickets.map(normalizeTicket) as Ticket[]
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { createdBy: true, assignedTo: true, attachments: { include: { uploadedBy: true } }, comments: { include: { author: true } } }
  })
  return ticket ? normalizeTicket(ticket) : null
}

export async function createTicket(payload: Partial<Ticket>): Promise<Ticket> {
function makeId() {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    try { return (crypto as any).randomUUID() } catch {}
  }
  return `tkt-${Date.now()}-${Math.floor(Math.random()*10000)}`
}

  const id = (payload as any).id ?? makeId()
  const created = await prisma.ticket.create({
    data: {
      id,
      title: payload.title ?? 'Sans titre',
      description: payload.description ?? '',
      category: (payload as any).category ?? 'other',
      priority: (payload as any).priority ?? 'low',
      status: (payload as any).status ?? 'open',
      createdAt: payload.createdAt ?? new Date(),
      updatedAt: payload.updatedAt ?? new Date(),
      dueDate: payload.dueDate ?? null,
      resolvedAt: payload.resolvedAt ?? null,
      metadata: JSON.stringify(payload.metadata ?? {}),
      tags: (payload.tags ?? []).join(','),
      location: payload.location ? JSON.stringify(payload.location) : null,
      createdBy: { connect: { id: (payload as any).createdBy?.id ?? (payload as any).createdById } },
      assignedTo: (payload as any).assignedTo ? { connect: { id: (payload as any).assignedTo.id } } : undefined,
    },
    include: {
      createdBy: true,
      assignedTo: true,
      attachments: { include: { uploadedBy: true } },
      comments: { include: { author: true } },
    }
  })
  return normalizeTicket(created as any) as Ticket
}

export async function updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket | null> {
  try {
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...patch as any,
        updatedAt: new Date(),
        assignedTo: (patch as any).assignedTo ? { connect: { id: (patch as any).assignedTo.id } } : undefined,
      },
      include: {
        createdBy: true,
        assignedTo: true,
        attachments: { include: { uploadedBy: true } },
        comments: { include: { author: true } },
      }
    })
    return normalizeTicket(updated as any) as Ticket
  } catch (e) {
    return null
  }
}

export async function deleteTicket(id: string): Promise<boolean> {
  try {
    await prisma.ticket.delete({ where: { id } })
    return true
  } catch (e) {
    return false
  }
}

export async function getEmployees(): Promise<Employee[]> {
  return await prisma.employee.findMany() as unknown as Employee[]
}

export default {
  init,
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getEmployees,
}
