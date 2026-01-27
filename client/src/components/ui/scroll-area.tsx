import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    maxHeight?: string
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
    ({ className, children, maxHeight = "50vh", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-y-auto custom-scrollbar",
                    className
                )}
                style={{ maxHeight }}
                {...props}
            >
                {children}
            </div>
        )
    }
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
