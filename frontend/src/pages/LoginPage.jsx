import { SignIn } from '@clerk/clerk-react'

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        fallbackRedirectUrl="/"
      />
    </div>
  )
}

export default LoginPage