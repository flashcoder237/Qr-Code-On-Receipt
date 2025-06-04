// src/components/ui/collapsible.tsx
import * as React from "react"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CollapsibleContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
} | null>(null)

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open = false, onOpenChange, children, className, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(open)
    
    const isControlled = onOpenChange !== undefined
    const isOpen = isControlled ? open : internalOpen
    
    const handleOpenChange = React.useCallback((newOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newOpen)
      } else {
        setInternalOpen(newOpen)
      }
    }, [isControlled, onOpenChange])

    React.useEffect(() => {
      if (isControlled) {
        setInternalOpen(open)
      }
    }, [open, isControlled])

    return (
      <CollapsibleContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ asChild, onClick, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext)
    
    if (!context) {
      throw new Error("CollapsibleTrigger must be used within a Collapsible component")
    }

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      context.onOpenChange(!context.open)
      onClick?.(event)
    }

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children as React.ReactElement, {
        ...props,
        onClick: handleClick,
        ref,
      })
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, style, children, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext)
    
    if (!context) {
      throw new Error("CollapsibleContent must be used within a Collapsible component")
    }

    const contentRef = React.useRef<HTMLDivElement>(null)
    const [height, setHeight] = React.useState<number | undefined>(
      context.open ? undefined : 0
    )

    React.useEffect(() => {
      const element = contentRef.current
      if (!element) return

      if (context.open) {
        // Ouvrir
        const scrollHeight = element.scrollHeight
        setHeight(scrollHeight)
        
        const timer = setTimeout(() => {
          setHeight(undefined)
        }, 300) // Durée de l'animation
        
        return () => clearTimeout(timer)
      } else {
        // Fermer
        const scrollHeight = element.scrollHeight
        setHeight(scrollHeight)
        
        requestAnimationFrame(() => {
          setHeight(0)
        })
      }
    }, [context.open])

    if (!context.open && height === 0) {
      return null
    }

    return (
      <div
        ref={(node) => {
          contentRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${className || ""}`}
        style={{
          height: height !== undefined ? `${height}px` : 'auto',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }