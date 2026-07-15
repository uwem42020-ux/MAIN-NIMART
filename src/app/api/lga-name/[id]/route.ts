import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data } = await supabaseServer.from('lga_centers').select('lga_name').eq('lga_id', parseInt(params.id)).single();
  return NextResponse.json({ name: data?.lga_name || params.id });
}