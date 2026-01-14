import { NextResponse } from 'next/server'
import * as db from '@/lib/db'

export async function GET(_req: Request, context: any) {
  // Next may provide params as a Promise or object depending on environment
  const paramsObj = context?.params && typeof context.params.then === 'function' ? await context.params : context?.params
  const id = paramsObj?.id
  const ticket = await db.getTicketById(id)
  if (!ticket) return new Response('Not found', { status: 404 })
  return NextResponse.json(ticket)
}

export async function PUT(req: Request, context: any) {
  try {
    const paramsObj = context?.params && typeof context.params.then === 'function' ? await context.params : context?.params
    const id = paramsObj?.id
    const body = await req.json()
    const updated = await db.updateTicket(id, body)
    if (!updated) return new Response('Not found', { status: 404 })
    return NextResponse.json(updated)
  } catch (e: any) {
    return new Response(e?.message ?? 'Bad request', { status: 400 })
  }
}

export async function DELETE(_req: Request, context: any) {
  const paramsObj = context?.params && typeof context.params.then === 'function' ? await context.params : context?.params
  const id = paramsObj?.id
  const ok = await db.deleteTicket(id)
  return new Response(ok ? null : 'Not found', { status: ok ? 204 : 404 })
}
