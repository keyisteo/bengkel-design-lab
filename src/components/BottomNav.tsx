import { isDarkBrand } from '../lib/utils'
import type { ProjectBrand } from '../types'

export interface NavItem {
  id: string
  icon: string
  label: string
  onClick?: () => void
}

interface BottomNavProps {
  active: string
  items: NavItem[]
  brand?: ProjectBrand
  badge?: number
}

export function BottomNav({ active, items, brand, badge }: BottomNavProps) {
  const dark = brand ? isDarkBrand(brand.bgSubtle) : false
  const borderColor = dark ? '#3A3A3A' : '#E0D3C3'
  const activeColor = brand?.accentColor ?? '#C96A3A'
  const inactiveColor = brand?.textMuted ?? (dark ? '#5F5E5A' : '#8C7B6B')
  const bg = dark ? '#1A1A1A' : 'rgba(255,255,255,0.95)'
  const hasBackdrop = !dark

  return (
    <div
      className="sticky bottom-0 flex border-t safe-bottom"
      style={{
        background: hasBackdrop ? undefined : bg,
        backdropFilter: hasBackdrop ? 'blur(12px)' : undefined,
        borderColor,
        backgroundColor: hasBackdrop ? undefined : bg,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors"
            style={{ color: isActive ? activeColor : inactiveColor }}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
            {badge !== undefined && item.id === active && (
              <span
                className="absolute top-1 right-1/2 translate-x-4 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: activeColor, color: '#fff' }}
              >
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
