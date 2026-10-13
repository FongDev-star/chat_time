import { SignIn } from '@clerk/clerk-react'
import { clerkAppearance } from '../lib/clerkAppearance'

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        fallbackRedirectUrl="/"
        appearance={clerkAppearance}
      />
    </div>
  )
}

export default LoginPage