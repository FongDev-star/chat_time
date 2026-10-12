export const displayName = (user) =>
  user?.fullName || user?.username || 'Unknown user'

export const getOtherUser = (conversation, myId) =>
  conversation.participants.find((p) => p._id !== myId) ||
  conversation.participants[0]

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const formatChatTime = (iso) => {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return formatTime(iso)
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

