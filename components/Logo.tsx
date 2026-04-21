interface LogoProps {
  showTagline?: boolean
  size?: 'small' | 'medium' | 'large'
}

const sizeMap = {
  small:  { icon: 28, font: 16 },
  medium: { icon: 32, font: 18 },
  large:  { icon: 44, font: 24 },
}

export default function Logo({ size = 'medium' }: LogoProps) {
  const { icon, font } = sizeMap[size]

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: icon * 0.35 }}>
      <svg width={icon} height={icon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="36" height="36" rx="9" fill="#0d1b2a" />
        <rect x="9" y="9" width="3.2" height="22" fill="white" />
        <rect x="27.8" y="9" width="3.2" height="22" fill="white" />
        <path d="M12.2 9 L15 9 L28 27 L28 31 L25.2 31 Z" fill="white" />
        <circle cx="17.5" cy="14" r="1.2" fill="#e04e1a" />
        <circle cx="22.5" cy="14" r="1.2" fill="#e04e1a" />
        <circle cx="17.5" cy="20" r="1.2" fill="#e04e1a" />
        <circle cx="22.5" cy="20" r="1.2" fill="#e04e1a" />
        <circle cx="17.5" cy="26" r="1.2" fill="#e04e1a" />
        <circle cx="22.5" cy="26" r="1.2" fill="#e04e1a" />
      </svg>
      <span style={{
        fontFamily: 'var(--font-space-grotesk), sans-serif',
        fontWeight: 700,
        fontSize: font,
        letterSpacing: '-0.03em',
        color: '#0d1b2a',
        lineHeight: 1,
      }}>
        nvoyce
      </span>
    </div>
  )
}
