import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  try {
    const { order } = await request.json();
    if (!order) {
      return NextResponse.json({ error: 'Missing order' }, { status: 400 });
    }

    console.log('Received order:', order); // 👈 Log incoming order

    const { error } = await supabase.from('orders').insert({
      id: order.id,
      items: order.items,
      total_price: order.totalPrice,
      table_number: order.table,
      timestamp: order.timestamp,
      is_complete: false,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in /api/order:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}