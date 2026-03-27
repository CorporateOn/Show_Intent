import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  try {
    const { order } = await request.json();
    console.log('Received order:', order);

    if (!order) {
      return NextResponse.json({ error: 'Missing order' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        id: order.id,
        items: order.items,
        total_price: order.totalPrice,
        table_number: order.table,
        timestamp: order.timestamp,
        is_complete: false,
      })
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Order inserted:', data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('is_complete', false)
      .order('timestamp', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    const formatted = data.map(order => ({
      id: order.id,
      items: order.items,
      totalPrice: order.total_price,   
      table: order.table_number,      
      timestamp: order.timestamp,
      isComplete: order.is_complete,
    }));

    return Response.json(formatted);
  } catch {
    return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}