import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware((auth, req) => {
  // Allow unauthenticated access to public proposal endpoints
  const pathname = req.nextUrl.pathname
  const publicRoutes = [
    '/api/proposals/generate-invoice',
    '/api/proposals/decline',
    '/api/proposals/notify',
  ]

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
