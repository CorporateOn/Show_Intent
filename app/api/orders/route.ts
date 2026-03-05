import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Helper to create a Supabase client that can read/write cookies
async function createClient() {
  const cookieStore = await cookies()   // <-- await the promise
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}

// GET /api/orders – fetch pending orders (for waiters)
export async function GET() {
  const supabase = await createClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .order('timestamp', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(orders)
}

// POST /api/orders – place a new order (public)
export async function POST(req: Request) {
  const body = await req.json()
  const { items, totalPrice, table } = body

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        items,
        total_price: totalPrice,
        table_number: table,
        status: 'pending',
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

// PATCH /api/orders – mark an order as completed (requires auth)
export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}