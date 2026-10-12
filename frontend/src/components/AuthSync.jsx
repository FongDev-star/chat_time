import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '../lib/api'
import { useUserStore } from '../stores/useUserStore'
import { useChatStore } from '../stores/useChatStore'
import { useSocketStore } from '../stores/useSocketStore'

function AuthSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth()

  const myId = useUserStore((s) => s.currentUser?._id)
  const fetchCurrentUser = useUserStore((s) => s.fetchCurrentUser)
  const clearCurrentUser = useUserStore((s) => s.clearCurrentUser)
  const resetChats = useChatStore((s) => s.resetChats)
  const connectSocket = useSocketStore((s) => s.connect)
  const disconnectSocket = useSocketStore((s) => s.disconnect)

  // Always give the API client the latest token getter
  useEffect(() => {
    setTokenGetter(getToken)
  })

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) {
      fetchCurrentUser()
    } else {
      clearCurrentUser()
      resetChats()
    }
  }, [isLoaded, isSignedIn, fetchCurrentUser, clearCurrentUser, resetChats])

  // Connect the socket only after our MongoDB user exists
  useEffect(() => {
    if (isSignedIn && myId) {
      connectSocket(getToken)
    } else {
      disconnectSocket()
    }
  }, [isSignedIn, myId, getToken, connectSocket, disconnectSocket])

  return null
}

export default AuthSync

