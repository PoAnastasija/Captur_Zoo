import { NextResponse } from 'next/server'
import * as db from '@/lib/db'

export async function GET() {
  const employees = await db.getEmployees()
  return NextResponse.json(employees)
}
