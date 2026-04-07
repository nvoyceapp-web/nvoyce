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
  form_data?: Record<string, unknown> | string
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
  if (daysOverdue > 45) urgencyMultiplier = 1.5 // Very overdue
  if (daysOverdue > 60) urgencyMultiplier = 2.0 // Critical

  return baseScore * urgencyMultiplier
}

/**
 * Calculate Payme action score for a stale proposal
 * Score = days_since_sent × amount × historical_conversion_rate
 * Higher score = higher priority (funnel replenishment needed)
 * Only counts from when proposal was SENT, not from creation
 */
function scoreStaleProposal(doc: Document): number {
  // For proposals, we'll calculate days from creation for now
  // Dashboard will calculate days from 'sent' status
  const daysSinceSent = (new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24)

  // Only surface proposals older than 3 days after being sent
  if (daysSinceSent < 3) return 0

  // Assume 60% historical conversion rate for gig workers
  const conversionRate = 0.6

  // Score increases over time - older proposals are more urgent
  const ageMultiplier = Math.min(daysSinceSent / 14, 1.5) // Caps at 14 days

  return daysSinceSent * doc.price * conversionRate * ageMultiplier
}

/**
 * Calculate Payme action score for a stale draft
 * Score = days_since_created × amount
 * Alerts user to send draft proposals that have been sitting for 2+ days
 */
function scoreStaleDraft(doc: Document): number {
  const daysSinceCreated = (new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24)

  // Flag drafts that have been sitting for 2+ days
  if (daysSinceCreated < 2) return 0

  // Simple score - just alert presence
  return daysSinceCreated * doc.price
}

/**
 * Calculate Payme action score for expiring proposals
 * Alerts user when proposals are expiring soon (2 days or less)
 * Assumes expiration info is stored in form_data.expirationDays
 */
function scoreExpiringProposal(doc: Document): number {
  // Get expiration days from form_data
  const formData = typeof doc.form_data === 'string' ? JSON.parse(doc.form_data) : doc.form_data || {}
  const expirationDays = parseInt(formData.expirationDays || '7', 10)

  const daysSinceSent = (new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24)
  const daysRemaining = expirationDays - daysSinceSent

  // Flag if less than 2 days remaining
  if (daysRemaining > 2) return 0

  // Higher score if very close to expiration
  const urgencyBoost = daysRemaining <= 1 ? 1.5 : 1
  return doc.price * urgencyBoost
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
        if (daysOverdue > 60) urgency = 'critical'
        else if (daysOverdue > 45) urgency = 'high'

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
    } else if (doc.doc_type === 'proposal' && doc.status === 'sent') {
      // Stale proposal - pending response after being sent
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
    } else if (doc.doc_type === 'proposal' && doc.status === 'draft') {
      // Stale draft - sitting unsent for 2+ days
      const score = scoreStaleDraft(doc)

      if (score > 0) {
        const daysSince = Math.floor((new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24))

        actions.push({
          id: doc.id,
          type: 'proposal',
          priority: score,
          client_name: doc.client_name,
          amount: doc.price,
          action_text: `📝 Draft proposal for ${doc.client_name} ($${doc.price.toFixed(2)}) - ${daysSince} days. Ready to send?`,
          urgency: 'medium',
          icon: '🔵',
          days_since: daysSince
        })
      }
    } else if (doc.doc_type === 'proposal' && (doc.status === 'sent' || doc.status === 'received')) {
      // Expiring proposal - check if expiring soon
      const expiringScore = scoreExpiringProposal(doc)

      if (expiringScore > 0) {
        const formData = typeof doc.form_data === 'string' ? JSON.parse(doc.form_data) : doc.form_data || {}
        const expirationDays = parseInt(formData.expirationDays || '7', 10)
        const daysSinceSent = Math.floor((new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24))
        const daysRemaining = expirationDays - daysSinceSent

        actions.push({
          id: doc.id,
          type: 'proposal',
          priority: expiringScore,
          client_name: doc.client_name,
          amount: doc.price,
          action_text: `⏰ Proposal for ${doc.client_name} ($${doc.price.toFixed(2)}) expires in ${Math.max(0, daysRemaining)} day(s)`,
          urgency: daysRemaining <= 1 ? 'critical' : 'high',
          icon: daysRemaining <= 1 ? '🔴' : '🟡',
          days_since: daysRemaining
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
