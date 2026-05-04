import Image from "next/image"

interface LogoProps {
  size?: number
  showName?: boolean
  className?: string
}

export function Logo({ size = 28, showName = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/truegraph-logo.png"
        alt="TrueGraph"
        width={size}
        height={size}
        className="shrink-0"
        priority
      />
      {showName && (
        <span className="text-sm font-semibold text-text-primary">
          TrueGraph
        </span>
      )}
    </div>
  )
}
