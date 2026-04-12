interface LogoProps {
  showTagline?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function Logo({ showTagline = false, size = 'medium' }: LogoProps) {
  const imgHeights = {
    small: 'h-10',
    medium: 'h-14',
    large: 'h-20',
  }

  return (
    <div className="flex flex-col items-start">
      <img
        src="/logo.png"
        alt="Nvoyce — We do the hard stuff. You get paid."
        className={`${imgHeights[size]} w-auto object-contain`}
      />
    </div>
  )
}
