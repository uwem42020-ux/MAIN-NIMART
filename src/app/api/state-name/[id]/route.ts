import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data } = await supabaseServer.from('lga_centers').select('state_name').eq('state_id', parseInt(params.id)).single();
  return NextResponse.json({ name: data?.state_name || params.id });
}