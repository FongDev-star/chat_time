import { SignUp } from '@clerk/clerk-react'
import { clerkAppearance } from '../lib/clerkAppearance'

function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        fallbackRedirectUrl="/"
        appearance={clerkAppearance}
      />
    </div>
  )
}

export default SignupPage