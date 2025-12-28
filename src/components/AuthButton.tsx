import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from 'convex/react'
import { LogIn, LogOut, X } from 'lucide-react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

export function AuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
  }

  if (isAuthenticated) {
    return (
      <button
        onClick={() => void signOut()}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => {
          setMode('signIn')
          setShowModal(true)
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Sign In</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-xl border border-gold-dark/20 bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-content-fg/40 hover:text-content-fg"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-6 text-center font-serif text-2xl font-light text-content-fg">
              {mode === 'signIn' ? 'Welcome Back' : 'Create Account'}
            </h2>

            {mode === 'signIn' ? (
              <SignInForm
                onSuccess={() => setShowModal(false)}
                onSwitchToSignUp={() => setMode('signUp')}
              />
            ) : (
              <SignUpForm
                onSuccess={() => setShowModal(false)}
                onSwitchToSignIn={() => setMode('signIn')}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
