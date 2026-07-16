import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;                     // ✅ unwrap the Promise
  const { data } = await supabaseServer
    .from('lga_centers')
    .select('lga_name')
    .eq('lga_id', parseInt(id))
    .single();
  return NextResponse.json({ name: data?.lga_name || id });
}