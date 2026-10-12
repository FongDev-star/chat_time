import { SignUp } from '@clerk/clerk-react'

function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        fallbackRedirectUrl="/"
      />
    </div>
  )
}

export default SignupPage