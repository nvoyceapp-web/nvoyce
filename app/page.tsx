import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import LandingClient from './_landing/LandingClient'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')
  return <LandingClient />
}
