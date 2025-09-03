'use client'

import { useState, useCallback, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { useAuth } from '../../../components/AuthProvider'

interface FormState {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isLoading } = useAuth()
  
  // Group related state into a single object
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  
  // Use memoized handlers for better performance
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }, [])
  
  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    
    const { email, password } = formState
    if (!email || !password) return
    
    try {
      await signIn(email, password)
      router.push('/polls')
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to sign in. Please check your credentials.')
    }
  }, [formState, signIn, router])

  // Focus on email input when component mounts
  const emailInputRef = useCallback((inputElement: HTMLInputElement) => {
    if (inputElement) {
      inputElement.focus()
    }
  }, [])

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm" role="alert" aria-live="assertive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                value={formState.email}
                onChange={handleInputChange}
                required
                aria-label="Email address"
                ref={emailInputRef}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                placeholder="••••••••" 
                value={formState.password}
                onChange={handleInputChange}
                required
                aria-label="Password"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full transition-colors duration-200" 
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse mr-2">⟳</span>
                  Signing in...
                </>
              ) : 'Login'}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}