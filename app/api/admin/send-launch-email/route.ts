import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { sendLaunchAnnouncementEmail } from '@/lib/email'

// One-time route to send launch announcement to all existing users
// Protected by ADMIN_SECRET env var — call once on launch day
// POST /api/admin/send-launch-email with { secret: process.env.ADMIN_SECRET }
export async function POST(req: NextRequest) {
  const { secret } = await req.json()

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerk = await clerkClient()
  const { data: users } = await clerk.users.getUserList({ limit: 500 })

  const results = { sent: 0, failed: 0, errors: [] as string[] }

  for (const user of users) {
    const primary = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)
    if (!primary?.emailAddress) continue

    try {
      await sendLaunchAnnouncementEmail({
        userEmail: primary.emailAddress,
        userName: user.firstName || 'there',
      })
      results.sent++
      console.log(`✅ Launch email sent to ${primary.emailAddress}`)
      // Small delay to avoid hitting Resend rate limits
      await new Promise(r => setTimeout(r, 200))
    } catch (err: any) {
      results.failed++
      results.errors.push(`${primary.emailAddress}: ${err?.message}`)
      console.error(`❌ Failed for ${primary.emailAddress}:`, err)
    }
  }

  return NextResponse.json({ message: 'Done', ...results })
}
