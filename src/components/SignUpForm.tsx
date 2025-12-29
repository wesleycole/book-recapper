import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

interface SignUpFormProps {
  onSuccess?: () => void
  onSwitchToSignIn?: () => void
}

export function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      formData.set('flow', 'signUp')

      await signIn('password', formData)
      onSuccess?.()
    } catch (err) {
      setError('Could not create account. Email may already be in use.')
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
          placeholder="At least 8 characters"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-content-fg/70 mb-1">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
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
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
      {onSwitchToSignIn && (
        <p className="text-center text-sm text-content-fg/60">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  )
}
