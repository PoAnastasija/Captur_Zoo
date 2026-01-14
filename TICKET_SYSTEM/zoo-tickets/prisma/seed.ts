import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const employees = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data', 'employees.json'), 'utf-8'))
const mockTickets = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data', 'tickets.json'), 'utf-8'))

async function main() {
  console.log('Seeding employees...')
  for (const e of employees) {
    await prisma.employee.upsert({
      where: { id: e.id },
      update: {
        name: e.name,
        email: e.email,
        role: e.role,
        department: e.department,
        phone: e.phone ?? null,
      },
      create: {
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        department: e.department,
        phone: e.phone ?? null,
      }
    })
  }

  console.log('Seeding tickets...')
  for (const t of mockTickets) {
    // create ticket
    const ticket = await prisma.ticket.upsert({
      where: { id: t.id },
      update: {
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        updatedAt: t.updatedAt ?? new Date(),
        dueDate: t.dueDate ?? null,
        metadata: JSON.stringify(t.metadata ?? {}),
        tags: (t.tags ?? []).join(','),
        location: t.location ? JSON.stringify(t.location) : null,
      },
      create: {
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt ?? new Date(),
        updatedAt: t.updatedAt ?? new Date(),
        dueDate: t.dueDate ?? null,
        metadata: JSON.stringify(t.metadata ?? {}),
        tags: (t.tags ?? []).join(','),
        location: t.location ? JSON.stringify(t.location) : null,
        createdBy: { connect: { id: t.createdBy.id } },
        assignedTo: t.assignedTo ? { connect: { id: t.assignedTo.id } } : undefined,
      },
      include: { createdBy: true }
    })

    // attachments
    if (Array.isArray(t.attachments) && t.attachments.length > 0) {
      for (const a of t.attachments) {
        await prisma.ticketAttachment.upsert({
          where: { id: a.id },
          update: {
            filename: a.filename,
            url: a.url,
            type: a.type,
            size: a.size,
            uploadedAt: a.uploadedAt ?? new Date(),
            uploadedById: a.uploadedBy.id,
            ticketId: ticket.id,
          },
          create: {
            id: a.id,
            filename: a.filename,
            url: a.url ?? '',
            type: a.type ?? 'file',
            size: a.size ?? 0,
            uploadedAt: a.uploadedAt ?? new Date(),
            uploadedBy: { connect: { id: a.uploadedBy.id } },
            ticket: { connect: { id: ticket.id } },
          }
        })
      }
    }
  }

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
