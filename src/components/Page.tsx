import type { ProjectBrand } from '../types'

interface PageProps {
  brand?: ProjectBrand
  className?: string
  children: React.ReactNode
}

export function Page({ brand, className = '', children }: PageProps) {
  return (
    <div
      className={`flex flex-col h-full overflow-y-auto ${className}`}
      style={brand ? { background: brand.bgSubtle } : undefined}
    >
      {children}
    </div>
  )
}
