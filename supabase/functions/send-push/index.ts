import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the notification record from the webhook
    const payload = await req.json()
    const record = payload.record

    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ error: 'No record or user_id found' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      })
    }

    // 2. Initialize Supabase with the Service Role Key (to read tokens securely)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Fetch the user's push token
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('fcm_token')
      .eq('id', record.user_id)
      .single()

    if (!profile || !profile.fcm_token) {
      return new Response(JSON.stringify({ error: 'User has no push token' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }

    // 4. Send the notification to Expo's Push API
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        title: record.title,
        body: record.body,
        data: record.data || {},
        sound: 'default',
        priority: 'high',
      }),
    })

    const expoData = await res.json()
    console.log('Expo response:', expoData)

    return new Response(JSON.stringify({ success: true, expoData }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})