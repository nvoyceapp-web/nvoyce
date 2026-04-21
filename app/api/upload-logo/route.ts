import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key — bypasses storage RLS, same pattern as all other API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let file: File | null = null
  try {
    const formData = await req.formData()
    file = formData.get('file') as File | null
  } catch {
    return NextResponse.json({ error: 'Invalid request — expected multipart form data' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Reject HEIC/HEIF — iPhones default to these but browsers can't display them
  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith('.heic') || lowerName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
    return NextResponse.json({
      error: 'HEIC/HEIF files are not supported. Please convert your photo to JPG or PNG first (on iPhone: Settings → Camera → Formats → Most Compatible).',
    }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({
      error: `Unsupported file type: ${file.type || 'unknown'}. Please upload a JPG, PNG, WebP, or GIF.`,
    }, { status: 400 })
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  try {
    const ext = lowerName.split('.').pop() || 'png'
    const fileName = `${userId}-logo-${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    // Save URL to user_settings
    const { error: saveError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })

    if (saveError) {
      console.error('Supabase user_settings save error:', saveError)
      return NextResponse.json({ error: `Failed to save logo URL: ${saveError.message}` }, { status: 500 })
    }

    return NextResponse.json({ publicUrl })
  } catch (err: any) {
    console.error('Logo upload error:', err)
    return NextResponse.json({ error: err?.message || 'Unexpected error during upload' }, { status: 500 })
  }
}
