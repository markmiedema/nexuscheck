'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card } from '@/components/ui/card'
import { Check, X, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'

// Password validation regex - same as signup
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/

const updatePasswordSchema = z.object({
  password: z.string().regex(passwordRegex, {
    message: 'Password does not meet requirements',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password')

  // Verify the user has a valid session (from the reset link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // No valid session - redirect to forgot password
        router.push('/forgot-password')
        return
      }
      setIsCheckingSession(false)
    }
    checkSession()
  }, [router])

  const onSubmit = async (data: UpdatePasswordValues) => {
    setError('')
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) throw error

      setSuccess(true)
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  // Password requirements component
  const RequirementsList = ({ pwd }: { pwd: string }) => {
    const reqs = [
      { re: /.{8,}/, label: "At least 8 characters" },
      { re: /[A-Z]/, label: "One uppercase letter" },
      { re: /[a-z]/, label: "One lowercase letter" },
      { re: /[0-9]/, label: "One number" },
    ]

    return (
      <div className="space-y-1.5 pt-1">
        {reqs.map((r, idx) => {
          const isMet = r.re.test(pwd || '')
          return (
            <div key={idx} className="flex items-center space-x-2 text-xs">
              {isMet ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={cn(isMet ? "text-green-600" : "text-muted-foreground")}>
                {r.label}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-floating">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Password Updated</h2>
          <p className="text-muted-foreground">
            Your password has been successfully updated. Redirecting you to login...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="max-w-md w-full p-8 space-y-6 shadow-floating">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Set New Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              New Password
            </label>
            <PasswordInput
              id="password"
              placeholder="Enter new password"
              autoComplete="new-password"
              {...register('password')}
            />
            <RequirementsList pwd={password} />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
              Confirm New Password
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirm new password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Updating password...' : 'Update Password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
