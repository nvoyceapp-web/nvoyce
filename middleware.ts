import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public API routes that don't require authentication
const isPublicApiRoute = createRouteMatcher([
  '/api/proposals/generate-invoice',
  '/api/proposals/decline',
  '/api/proposals/notify',
  '/p(.*)',
])

export default clerkMiddleware((auth, req) => {
  // Allow public API routes without authentication
  if (isPublicApiRoute(req)) {
    return
  }
  // Other routes remain protected
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
