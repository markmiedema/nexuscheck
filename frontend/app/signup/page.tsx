'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().regex(passwordRegex, {
    message: 'Password does not meet requirements',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password')

  const onSubmit = async (data: SignupFormValues) => {
    setGlobalError('')
    setIsLoading(true)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper to check password requirements for visual feedback
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
        <div className="max-w-md w-full space-y-6 bg-card p-8 rounded-xl shadow-lg border border-border backdrop-blur-sm text-center">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Account Created</h2>
          <p className="text-muted-foreground">
            Your account has been successfully created. Redirecting you to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-6 bg-card p-8 rounded-xl shadow-lg border border-border backdrop-blur-sm">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to create your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {globalError && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium">
              {globalError}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              Email
            </label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">
              Password
            </label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('password')}
            />
            {/* Real-time password strength indicator */}
            <RequirementsList pwd={password} />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
