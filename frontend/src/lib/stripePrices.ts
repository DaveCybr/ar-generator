export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1Tf8E62LSlGk7TpHuIRDruVK',
    yearly: 'price_1Tf8E92LSlGk7TpHEjMdQaXp',
  },
  business: {
    monthly: 'price_1Tf8EC2LSlGk7TpHl7rwvDhv',
    yearly: 'price_1Tf8EG2LSlGk7TpHNCuIq2w1',
  },
} as const

export const STRIPE_PRODUCTS = {
  pro: 'prod_UeQKVvY5w8BCif',
  business: 'prod_UeQKyyoDW2eQGc',
} as const

export type PlanType = 'free' | 'pro' | 'business'
export type BillingInterval = 'monthly' | 'yearly'
