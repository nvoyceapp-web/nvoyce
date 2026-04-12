interface LogoProps {
  showTagline?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function Logo({ showTagline = false, size = 'medium' }: LogoProps) {
  const imgHeights = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16',
  }

  const taglineSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <img
        src="/logo.png"
        alt="Nvoyce"
        className={`${imgHeights[size]} w-auto object-contain`}
      />
      {showTagline && (
        <p className={`text-gray-500 font-medium ${taglineSizes[size]}`}>
          We do the hard stuff. You get paid.
        </p>
      )}
    </div>
  )
}
