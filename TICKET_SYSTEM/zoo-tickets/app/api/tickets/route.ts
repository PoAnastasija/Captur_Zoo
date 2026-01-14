import { NextResponse } from 'next/server'
import * as db from '@/lib/db'

export async function GET() {
  const tickets = await db.getTickets()
  return NextResponse.json(tickets)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const created = await db.createTicket(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return new Response(e?.message ?? 'Bad request', { status: 400 })
  }
}
