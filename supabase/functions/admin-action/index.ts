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

const VALID_PLANS = ['free', 'pro', 'business'] as const
type Plan = typeof VALID_PLANS[number]

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Missing or invalid authorization header' }, 401, cors)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Resolve caller from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401, cors)
    }

    // Verify caller is an admin BEFORE doing anything
    const { data: adminRow } = await serviceClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) {
      return json({ error: 'Forbidden: admin access required' }, 403, cors)
    }

    const body = await req.json().catch(() => null)
    const action: string | undefined = body?.action

    if (!action) {
      return json({ error: 'Missing action' }, 400, cors)
    }

    // get_users is a read-only listing — it has no target user
    if (action === 'get_users') {
      const { data, error } = await serviceClient
        .from('admin_user_overview')
        .select('*')
        .order('joined_at', { ascending: false })

      if (error) throw error

      return json({ success: true, users: data ?? [] }, 200, cors)
    }

    const targetUserId: string | undefined = body?.target_user_id
    if (!targetUserId) {
      return json({ error: 'Missing target_user_id' }, 400, cors)
    }

    switch (action) {
      // --------------------------------------------------------
      case 'manual_upgrade':
      case 'manual_downgrade': {
        const plan: string | undefined = body?.plan
        if (!plan || !VALID_PLANS.includes(plan as Plan)) {
          return json({ error: `plan must be one of: ${VALID_PLANS.join(', ')}` }, 400, cors)
        }

        const { error } = await serviceClient
          .from('subscriptions')
          .update({ plan, status: 'active' })
          .eq('user_id', targetUserId)

        if (error) throw error

        return json({ success: true, action, target_user_id: targetUserId, plan }, 200, cors)
      }

      // --------------------------------------------------------
      case 'suspend_user': {
        const reason: string | undefined = body?.reason

        const { error } = await serviceClient
          .from('profiles')
          .update({
            is_suspended: true,
            suspended_at: new Date().toISOString(),
            suspended_reason: reason ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetUserId)

        if (error) throw error

        return json({ success: true, action, target_user_id: targetUserId }, 200, cors)
      }

      // --------------------------------------------------------
      case 'unsuspend_user': {
        const { error } = await serviceClient
          .from('profiles')
          .update({
            is_suspended: false,
            suspended_at: null,
            suspended_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetUserId)

        if (error) throw error

        return json({ success: true, action, target_user_id: targetUserId }, 200, cors)
      }

      // --------------------------------------------------------
      default:
        return json({ error: `Unknown action: ${action}` }, 400, cors)
    }
  } catch (err) {
    console.error('[admin-action]', err)
    return json({ error: 'Internal server error' }, 500, cors)
  }
})
