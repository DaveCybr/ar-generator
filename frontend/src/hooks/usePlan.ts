import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PlanType } from '../lib/stripePrices'

export interface PlanLimits {
  max_projects: number
  max_markers: number
  has_watermark: boolean
  analytics_days: number
  can_custom_slug: boolean
  can_set_expiry: boolean
}

export const FREE_LIMITS: PlanLimits = {
  max_projects: 3,
  max_markers: 2,
  has_watermark: true,
  analytics_days: 7,
  can_custom_slug: false,
  can_set_expiry: false,
}

// Frontend fallback — mirrors the DB function get_plan_limits()
const PLAN_LIMITS_FALLBACK: Record<PlanType, PlanLimits> = {
  free: FREE_LIMITS,
  pro: {
    max_projects: 20,
    max_markers: 10,
    has_watermark: false,
    analytics_days: 30,
    can_custom_slug: true,
    can_set_expiry: true,
  },
  business: {
    max_projects: -1,
    max_markers: -1,
    has_watermark: false,
    analytics_days: -1,
    can_custom_slug: true,
    can_set_expiry: true,
  },
}

interface UsePlanResult {
  plan: PlanType
  limits: PlanLimits
  loading: boolean
}

export function usePlan(): UsePlanResult {
  const [plan, setPlan] = useState<PlanType>('free')
  const [limits, setLimits] = useState<PlanLimits>(FREE_LIMITS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadPlan() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) setLoading(false)
          return
        }

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .single()

        const userPlan: PlanType = (sub?.plan as PlanType) ?? 'free'

        const { data: limitsData } = await supabase
          .rpc('get_plan_limits', { p_plan: userPlan })

        if (!cancelled) {
          setPlan(userPlan)
          setLimits((limitsData as PlanLimits | null) ?? PLAN_LIMITS_FALLBACK[userPlan])
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setPlan('free')
          setLimits(FREE_LIMITS)
          setLoading(false)
        }
      }
    }

    loadPlan()
    return () => { cancelled = true }
  }, [])

  return { plan, limits, loading }
}
