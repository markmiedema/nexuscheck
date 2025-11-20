'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Add the missing Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Nexus Check
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Automated sales tax nexus determination and liability estimation for modern businesses.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Login Button - Primary (Blue) */}
          <Link href="/login" passHref>
            <Button size="lg" className="w-full sm:w-auto px-8 text-lg h-12">
              Login
            </Button>
          </Link>

          {/* Sign Up Button - Secondary (Gray)
              NOTE: The CSS fix from the previous step (darkening 'secondary')
              will automatically make this button visible now.
          */}
          <Link href="/signup" passHref>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto px-8 text-lg h-12 border border-border/50"
            >
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
