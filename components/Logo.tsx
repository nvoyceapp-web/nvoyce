interface LogoProps {
  showTagline?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function Logo({ showTagline = false, size = 'medium' }: LogoProps) {
  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  }

  const taglineSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`font-bold text-gray-900 ${sizeClasses[size]} tracking-tight`}>
        <span className="inline-block">
          N<span className="inline-block w-1 h-5 bg-gradient-to-b from-purple-600 to-purple-400 mx-0.5 align-middle"></span>voyce
        </span>
      </div>
      {showTagline && (
        <p className={`text-gray-600 font-medium ${taglineSizes[size]}`}>
          We do the hard stuff. You get paid.
        </p>
      )}
    </div>
  )
}
