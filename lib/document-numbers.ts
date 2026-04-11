import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Assigns a sequential document number to a document at send time.
 *
 * Numbers are scoped per user_id + doc_type + year so:
 *   - Each company has its own independent sequence (INV-2026-001, INV-2026-002, ...)
 *   - Company A cannot infer Company B's invoice volume
 *   - Drafts have no number — number is only assigned when the document is sent
 *
 * Format: INV-YYYY-NNN (invoices) | PRO-YYYY-NNN (proposals)
 */
export async function assignDocumentNumber(
  userId: string,
  docType: 'invoice' | 'proposal',
  documentId: string
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = docType === 'invoice' ? 'INV' : 'PRO'
  const yearPrefix = `${prefix}-${year}-`

  // Count how many numbered docs this user already has for this type+year
  const { count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('doc_type', docType)
    .like('document_number', `${yearPrefix}%`)

  if (error) {
    console.error('Error counting documents for numbering:', error)
    throw error
  }

  const nextNum = (count || 0) + 1
  const documentNumber = `${yearPrefix}${String(nextNum).padStart(3, '0')}`

  const { error: updateError } = await supabase
    .from('documents')
    .update({ document_number: documentNumber })
    .eq('id', documentId)

  if (updateError) {
    console.error('Error assigning document number:', updateError)
    throw updateError
  }

  console.log(`Assigned ${documentNumber} to document ${documentId}`)
  return documentNumber
}
