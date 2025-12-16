import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
                    "placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                    "dark:placeholder:text-slate-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400",
                    "transition-all duration-200",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
