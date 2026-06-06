import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = ['https://ar.nano.co.id', 'http://localhost:5173']

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(data: unknown, status: number, corsHeaders: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors)
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Missing or invalid authorization header' }, 401, cors)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Resolve user from JWT — admin.auth.getUser validates the token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401, cors)
    }

    // Parse and validate request body
    const body = await req.json().catch(() => null)
    const priceId: string | undefined = body?.priceId
    if (!priceId) {
      return json({ error: 'Missing priceId in request body' }, 400, cors)
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })

    // Get or create Stripe customer
    const { data: sub, error: subError } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = row not found; anything else is a real error
      throw subError
    }

    let customerId = sub?.stripe_customer_id ?? null

    if (!customerId) {
      // Create a new Stripe customer and persist the ID
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await serviceClient
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://ar.nano.co.id/dashboard?upgraded=true',
      cancel_url: 'https://ar.nano.co.id/pricing',
      allow_promotion_codes: true,
    })

    return json({ url: session.url }, 200, cors)
  } catch (err) {
    console.error('[create-checkout-session]', err)
    return json({ error: 'Internal server error' }, 500, cors)
  }
})
