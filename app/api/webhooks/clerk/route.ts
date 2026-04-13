import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { sendWelcomeEmail } from '@/lib/email'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const headersList = await headers()
  const svix_id = headersList.get('svix-id')
  const svix_timestamp = headersList.get('svix-timestamp')
  const svix_signature = headersList.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: missing svix headers', { status: 400 })
  }

  const body = await req.json()
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Webhook verification failed', { status: 400 })
  }

  // Send welcome email on user creation
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name } = evt.data
    
    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id
    )

    if (!primaryEmail) {
      console.error('No primary email found for user:', id)
      return new Response('OK', { status: 200 })
    }

    // Start 7-day Pro trial
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    try {
      await supabase.from('subscriptions').upsert({
        user_id: id,
        plan: 'pro',
        status: 'active',
        current_period_end: trialEnd.toISOString(),
      })
      console.log(`✅ 7-day Pro trial started for ${id} — expires ${trialEnd.toISOString()}`)
    } catch (error) {
      console.error('❌ Failed to create trial subscription:', error)
    }

    try {
      await sendWelcomeEmail({
        userEmail: primaryEmail.email_address,
        userName: first_name || 'there',
      })
      console.log(`✅ Welcome email sent to ${primaryEmail.email_address}`)
    } catch (error) {
      console.error('❌ Welcome email failed:', error)
    }
  }

  return new Response('OK', { status: 200 })
}