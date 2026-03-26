import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  const { order } = await request.json();
  if (!order) {
    return NextResponse.json({ error: 'Missing order' }, { status: 400 });
  }

  const { error } = await supabase.from('orders').insert({
    id: order.id,
    items: order.items,
    total_price: order.totalPrice,
    table_number: order.table,
    timestamp: order.timestamp,
    is_complete: false,
  });

  if (error) {
    console.error('Failed to insert order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}