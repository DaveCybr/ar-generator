import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Maps Stripe price IDs to internal plan names
const PRICE_TO_PLAN: Record<string, 'pro' | 'business'> = {
  'price_1Tf8E62LSlGk7TpHuIRDruVK': 'pro',      // Pro Monthly  — Rp 99.000
  'price_1Tf8E92LSlGk7TpHEjMdQaXp': 'pro',      // Pro Yearly   — Rp 899.000
  'price_1Tf8EC2LSlGk7TpHl7rwvDhv': 'business', // Business Monthly — Rp 299.000
  'price_1Tf8EG2LSlGk7TpHNCuIq2w1': 'business', // Business Yearly  — Rp 2.499.000
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Read raw body as text — required for signature verification
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  try {
    switch (event.type) {

      // ----------------------------------------------------------------
      // Checkout completed — subscription is now active
      // ----------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Fetch full subscription from Stripe to get period dates + price
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = stripeSub.items.data[0]?.price.id
        const plan = PRICE_TO_PLAN[priceId] ?? 'pro'

        await db
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscriptionId,
            plan,
            status: 'active',
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: stripeSub.cancel_at_period_end,
          })
          .eq('stripe_customer_id', customerId)

        break
      }

      // ----------------------------------------------------------------
      // Subscription updated — plan change, renewal, cancellation toggle
      // ----------------------------------------------------------------
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription
        const customerId = stripeSub.customer as string
        const priceId = stripeSub.items.data[0]?.price.id
        const plan = PRICE_TO_PLAN[priceId] ?? 'pro'

        // Map Stripe status to our status enum
        const statusMap: Record<string, string> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'past_due',
          incomplete: 'past_due',
          incomplete_expired: 'canceled',
          paused: 'past_due',
        }
        const status = statusMap[stripeSub.status] ?? 'active'

        await db
          .from('subscriptions')
          .update({
            plan,
            status,
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: stripeSub.cancel_at_period_end,
          })
          .eq('stripe_customer_id', customerId)

        break
      }

      // ----------------------------------------------------------------
      // Subscription deleted — downgrade to free, keep the row
      // ----------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription
        const customerId = stripeSub.customer as string

        await db
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'active',
            stripe_subscription_id: null,
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
          })
          .eq('stripe_customer_id', customerId)

        break
      }

      // ----------------------------------------------------------------
      // Payment failed — mark as past_due
      // ----------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id

        if (!subscriptionId) break

        await db
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId)

        break
      }

      default:
        // Unhandled event type — log and return 200 so Stripe doesn't retry
        console.log('[stripe-webhook] Unhandled event type:', event.type)
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err)
    // Return 200 anyway — if we return 5xx, Stripe will retry and may loop
    return new Response('Handler error (logged)', { status: 200 })
  }

  return new Response('OK', { status: 200 })
})
