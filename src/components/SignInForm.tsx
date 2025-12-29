import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

interface SignInFormProps {
  onSuccess?: () => void
  onSwitchToSignUp?: () => void
}

export function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps) {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      formData.set('flow', 'signIn')

      await signIn('password', formData)
      onSuccess?.()
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-content-fg/70 mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-content-fg/70 mb-1">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-white hover:bg-primary/90"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
      {onSwitchToSignUp && (
        <p className="text-center text-sm text-content-fg/60">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-primary hover:underline"
          >
            Sign up
          </button>
        </p>
      )}
    </form>
  )
}
