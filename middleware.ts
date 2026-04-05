import { clerkMiddleware } from '@clerk/nextjs/server'

// Temporarily disabled route protection to diagnose rendering issue
// Will re-enable once app is confirmed working
export default clerkMiddleware()

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
