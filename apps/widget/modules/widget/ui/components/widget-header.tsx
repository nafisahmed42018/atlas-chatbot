import { cn } from "@workspace/ui/lib/utils"

export const WidgetHeader = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <header
      className={cn("bg-foreground p-4 text-primary-foreground", className)}
    >
      {children}
    </header>
  )
}
