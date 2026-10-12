import { Link } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { ArrowLeft } from 'lucide-react'

function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { openUserProfile, signOut } = useClerk()

  if (!isLoaded) {
    return <div className="p-6 text-white">Loading...</div>
  }

  const displayName =
    user.fullName || user.username || user.primaryEmailAddress?.emailAddress

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <div className="mx-auto max-w-md p-6 text-white">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={18} />
        Back to chats
      </Link>

      <div className="rounded-2xl bg-slate-800 p-6 text-center">
        <img
          src={user.imageUrl}
          alt={displayName}
          className="mx-auto h-24 w-24 rounded-full object-cover"
        />
        <h1 className="mt-4 text-2xl font-bold">{displayName}</h1>
        <p className="text-sm text-slate-400">
          {user.primaryEmailAddress?.emailAddress}
        </p>
        <p className="mt-1 text-xs text-slate-500">Joined {joined}</p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => openUserProfile()}
            className="rounded-lg bg-emerald-600 py-2 font-medium hover:bg-emerald-500"
          >
            Manage account
          </button>
          <button
            onClick={() => signOut({ redirectUrl: '/login' })}
            className="rounded-lg bg-slate-700 py-2 font-medium hover:bg-slate-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage