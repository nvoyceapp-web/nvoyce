/**
 * Payme Smart Assistant - Unified Scoring Algorithm
 * Prioritizes both invoices and proposals based on business urgency
 */

export interface Document {
  id: string
  client_name: string
  doc_type: 'invoice' | 'proposal'
  price: number
  status: string
  created_at: string
  days_outstanding?: number
}

export interface PaymeAction {
  id: string
  type: 'invoice' | 'proposal'
  priority: number
  client_name: string
  amount: number
  action_text: string
  urgency: 'critical' | 'high' | 'medium'
  icon: '🔴' | '🟡' | '🔵'
  days_since: number
}

/**
 * Calculate Payme action score for an overdue invoice
 * Score = (days_overdue × amount) + urgency_multiplier
 * Higher score = higher priority
 */
function scoreOverdueInvoice(doc: Document): number {
  const daysOverdue = Math.max(0, (new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24) - 30)

  // If not yet 30 days old, minimal score
  if (daysOverdue <= 0) return 0

  const baseScore = daysOverdue * doc.price

  // Urgency boost based on severity
  let urgencyMultiplier = 1
  if (daysOverdue > 60) urgencyMultiplier = 1.5 // Very overdue
  if (daysOverdue > 90) urgencyMultiplier = 2.0 // Critical

  return baseScore * urgencyMultiplier
}

/**
 * Calculate Payme action score for a stale proposal
 * Score = days_since_created × amount × historical_conversion_rate
 * Higher score = higher priority (funnel replenishment needed)
 */
function scoreStaleProposal(doc: Document): number {
  const daysSinceCreated = (new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24)

  // Only surface proposals older than 3 days
  if (daysSinceCreated < 3) return 0

  // Assume 60% historical conversion rate for gig workers
  const conversionRate = 0.6

  // Score increases over time - older proposals are more urgent
  const ageMultiplier = Math.min(daysSinceCreated / 14, 1.5) // Caps at 14 days

  return daysSinceCreated * doc.price * conversionRate * ageMultiplier
}

/**
 * Generate top recommendations for both invoices and proposals
 */
export function generatePaymeActions(documents: Document[]): PaymeAction[] {
  const actions: PaymeAction[] = []

  for (const doc of documents) {
    if (doc.doc_type === 'invoice' && (doc.status === 'unpaid' || doc.status === 'overdue')) {
      const score = scoreOverdueInvoice(doc)

      if (score > 0) {
        const daysOverdue = Math.floor((new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24) - 30)

        let urgency: 'critical' | 'high' | 'medium' = 'medium'
        if (daysOverdue > 90) urgency = 'critical'
        else if (daysOverdue > 60) urgency = 'high'

        actions.push({
          id: doc.id,
          type: 'invoice',
          priority: score,
          client_name: doc.client_name,
          amount: doc.price,
          action_text: `Send payment reminder to ${doc.client_name} for $${doc.price.toFixed(2)} (${daysOverdue} days overdue)`,
          urgency,
          icon: '🔴',
          days_since: daysOverdue
        })
      }
    } else if (doc.doc_type === 'proposal' && doc.status === 'pending') {
      const score = scoreStaleProposal(doc)

      if (score > 0) {
        const daysSince = Math.floor((new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24))

        actions.push({
          id: doc.id,
          type: 'proposal',
          priority: score,
          client_name: doc.client_name,
          amount: doc.price,
          action_text: `Follow up on proposal for ${doc.client_name} ($${doc.price.toFixed(2)}) - ${daysSince} days pending`,
          urgency: daysSince > 14 ? 'high' : 'medium',
          icon: '🟡',
          days_since: daysSince
        })
      }
    }
  }

  // Sort by priority score (highest first)
  return actions.sort((a, b) => b.priority - a.priority)
}

/**
 * Get top N recommendations
 */
export function getTopPaymeActions(documents: Document[], count: number = 3): PaymeAction[] {
  return generatePaymeActions(documents).slice(0, count)
}

/**
 * Get single top recommendation
 */
export function getTopPaymeAction(documents: Document[]): PaymeAction | null {
  const actions = generatePaymeActions(documents)
  return actions.length > 0 ? actions[0] : null
}
