import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('lga_centers')
    .select('lga_name')
    .eq('lga_id', parseInt(id))
    .single();
  return NextResponse.json({ name: data?.lga_name || id });
}