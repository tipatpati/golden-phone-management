import * as React from "react"
import { cn } from "@/lib/utils"

interface AnimatedPresenceProps {
  children: React.ReactNode
  show: boolean
  animation?: 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  duration?: 'short' | 'medium' | 'long'
  className?: string
}

export function AnimatedPresence({ 
  children, 
  show, 
  animation = 'fade',
  duration = 'medium',
  className 
}: AnimatedPresenceProps) {
  const [shouldRender, setShouldRender] = React.useState(show)

  React.useEffect(() => {
    if (show) {
      setShouldRender(true)
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => setShouldRender(false), 
        duration === 'short' ? 200 : duration === 'medium' ? 300 : 500
      )
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!shouldRender) return null

  const getAnimationClass = () => {
    const baseClass = show ? 'md-enter' : 'md-exit'
    
    switch (animation) {
      case 'scale':
        return show ? 'md-enter-scale' : 'md-exit-scale'
      case 'slide-up':
        return show ? 'md-enter-slide-up' : 'md-exit'
      case 'slide-down':
        return show ? 'md-enter-slide-down' : 'md-exit'
      default:
        return baseClass
    }
  }

  return (
    <div className={cn(getAnimationClass(), className)}>
      {children}
    </div>
  )
}

interface StateLayerProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function StateLayer({ children, className, disabled = false }: StateLayerProps) {
  return (
    <div className={cn("md-state-layer", disabled && "pointer-events-none opacity-50", className)}>
      {children}
    </div>
  )
}

interface SharedElementProps {
  children: React.ReactNode
  id: string
  className?: string
}

export function SharedElement({ children, id, className }: SharedElementProps) {
  return (
    <div 
      className={cn("md-shared-element", className)}
      data-shared-element={id}
    >
      {children}
    </div>
  )
}

// Hook for managing loading states with smooth transitions
export function useLoadingTransition(isLoading: boolean) {
  const [showLoading, setShowLoading] = React.useState(isLoading)
  const [showContent, setShowContent] = React.useState(!isLoading)

  React.useEffect(() => {
    if (isLoading) {
      setShowContent(false)
      setTimeout(() => setShowLoading(true), 50)
    } else {
      setShowLoading(false)
      setTimeout(() => setShowContent(true), 100)
    }
  }, [isLoading])

  return { showLoading, showContent }
}

// Hook for staggered animations
export function useStaggeredAnimation(items: any[], delay: number = 50) {
  const [visibleItems, setVisibleItems] = React.useState<number>(0)

  React.useEffect(() => {
    setVisibleItems(0)
    
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(index + 1)
      }, index * delay)
    })
  }, [items, delay])

  return visibleItems
}

export default AnimatedPresence