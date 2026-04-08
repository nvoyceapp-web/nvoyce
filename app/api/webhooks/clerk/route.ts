import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { sendWelcomeEmail } from '@/lib/email'

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

    try {
      await sendWelcomeEmail({
        userEmail: primaryEmail.email_address,
        userName: first_name || 'there',
        dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      })
      console.log(`✅ Welcome email sent to ${primaryEmail.email_address}`)
    } catch (error) {
      console.error('❌ Welcome email failed:', error)
      // Don't fail the webhook response; log and continue
    }
  }

  return new Response('OK', { status: 200 })
}