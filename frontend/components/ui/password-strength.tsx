import * as React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { validatePasswordStrength, PasswordRequirements } from "@/lib/utils/validation"

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const requirements = validatePasswordStrength(password)

  const checks = [
    { label: "At least 8 characters", met: requirements.minLength },
    { label: "One uppercase letter", met: requirements.hasUppercase },
    { label: "One lowercase letter", met: requirements.hasLowercase },
    { label: "One number", met: requirements.hasNumber },
  ]

  const allMet = Object.values(requirements).every(req => req === true)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              allMet && "bg-green-500 w-full",
              !allMet && Object.values(requirements).filter(Boolean).length >= 3 && "bg-yellow-500 w-3/4",
              !allMet && Object.values(requirements).filter(Boolean).length === 2 && "bg-orange-500 w-1/2",
              !allMet && Object.values(requirements).filter(Boolean).length === 1 && "bg-red-500 w-1/4"
            )}
          />
        </div>
        <span className={cn(
          "text-xs font-medium transition-colors",
          allMet && "text-green-600 dark:text-green-400",
          !allMet && "text-muted-foreground"
        )}>
          {allMet ? "Strong" : "Weak"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {checks.map((check, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              check.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {check.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
