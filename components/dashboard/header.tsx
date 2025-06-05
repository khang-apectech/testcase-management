interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl md:text-3xl">{heading}</h1>
        {text && <p className="text-sm md:text-lg text-muted-foreground">{text}</p>}
      </div>
      {children && <div className="mt-2 sm:mt-0">{children}</div>}
    </div>
  )
} 