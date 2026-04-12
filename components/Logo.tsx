interface LogoProps {
  showTagline?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function Logo({ showTagline = false, size = 'medium' }: LogoProps) {
  const imgHeights = {
    small: 'h-8',
    medium: 'h-10',
    large: 'h-14',
  }

  const src = showTagline ? '/logo.png' : '/logo-wordmark.png'
  const alt = showTagline
    ? 'Nvoyce — We do the hard stuff. You get paid.'
    : 'Nvoyce'

  return (
    <div className="flex flex-col items-center">
      <img
        src={src}
        alt={alt}
        className={`${imgHeights[size]} w-auto object-contain`}
      />
    </div>
  )
}
