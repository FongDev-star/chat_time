import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import {
  Bell,
  BellOff,
  MessageCircle,
  Plus,
  Search,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useChatStore } from '../stores/useChatStore'
import { useUserStore } from '../stores/useUserStore'
import { useSocketStore } from '../stores/useSocketStore'
import { displayName, formatChatTime, getOtherUser } from '../lib/utils'
import { canNotify, requestNotifyPermission } from '../lib/notify'
import Avatar from './Avatar'

function Sidebar() {
  const currentUser = useUserStore((s) => s.currentUser)
  const myId = currentUser?._id

  const conversations = useChatStore((s) => s.conversations)
  const selectedChatId = useChatStore((s) => s.selectedChatId)
  const selectChat = useChatStore((s) => s.selectChat)
  const isLoadingChats = useChatStore((s) => s.isLoadingChats)
  const loadChats = useChatStore((s) => s.loadChats)
  const searchResults = useChatStore((s) => s.searchResults)
  const isSearching = useChatStore((s) => s.isSearching)
  const searchUsers = useChatStore((s) => s.searchUsers)
  const clearSearch = useChatStore((s) => s.clearSearch)
  const startChat = useChatStore((s) => s.startChat)
  const onlineUserIds = useSocketStore((s) => s.onlineUserIds)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const toggleSound = useSettingsStore((s) => s.toggleSound)

  const [filter, setFilter] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [notifyPermission, setNotifyPermission] = useState(
    canNotify() ? Notification.permission : 'unsupported'
  )

  // How many unread messages I have in this chat
  const getUnread = (chat) =>
    chat.unread?.find((u) => String(u.user?._id || u.user) === myId)?.count || 0

  const totalUnread = conversations.reduce((sum, c) => sum + getUnread(c), 0)

  // Load chats once our MongoDB user exists
  useEffect(() => {
    if (myId) loadChats()
  }, [myId, loadChats])

  // Search for people as you type (waits 300ms after the last keystroke)
  useEffect(() => {
    if (!showNewChat) return
    const timer = setTimeout(() => searchUsers(userQuery), 300)
    return () => clearTimeout(timer)
  }, [userQuery, showNewChat, searchUsers])

  // Tab title shows total unread, like "(3) ChatTime"
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) ChatTime` : 'ChatTime'
  }, [totalUnread])

  // When I come back to this tab, mark the open chat as read
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && selectedChatId) selectChat(selectedChatId)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [selectedChatId, selectChat])

  const closeNewChat = () => {
    setShowNewChat(false)
    setUserQuery('')
    clearSearch()
  }

  const handleStartChat = async (user) => {
    const ok = await startChat(user._id)
    if (ok) closeNewChat()
  }

  const handleBell = async () => {
    if (notifyPermission === 'unsupported') {
      return toast.error('This browser does not support notifications')
    }
    if (notifyPermission === 'denied') {
      return toast.error(
        'Notifications are blocked. Allow them in the browser site settings.'
      )
    }
    if (notifyPermission === 'granted') {
      return toast('Browser notifications are on')
    }
    const result = await requestNotifyPermission()
    setNotifyPermission(result)
    if (result === 'granted') toast.success('Browser notifications enabled')
  }

  const filteredChats = conversations.filter((c) =>
    displayName(getOtherUser(c, myId))
      .toLowerCase()
      .includes(filter.trim().toLowerCase())
  )

  const queryLongEnough = userQuery.trim().length >= 2

  return (
    <aside className="flex w-full flex-col border-r border-slate-700 bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-700 p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-emerald-400" size={24} />
          <h1 className="text-xl font-bold">ChatTime</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBell}
            className="text-slate-400 hover:text-white"
            title="Browser notifications"
          >
            {notifyPermission === 'granted' ? (
              <Bell size={20} className="text-emerald-400" />
            ) : (
              <BellOff size={20} />
            )}
          </button>
          <button
            onClick={toggleSound}
            className="text-slate-400 hover:text-white"
            title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <Link to="/profile" className="text-slate-400 hover:text-white" title="Profile">
            <User size={20} />
          </Link>
          <UserButton />
        </div>
      </div>

      <div className="flex items-center gap-2 p-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-700 px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={() => (showNewChat ? closeNewChat() : setShowNewChat(true))}
          title={showNewChat ? 'Close' : 'New chat'}
          className="rounded-lg bg-emerald-600 p-2 hover:bg-emerald-500"
        >
          {showNewChat ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {showNewChat && (
        <div className="border-b border-slate-700 px-3 pb-3">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Find people by name or email..."
            autoFocus
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm outline-none placeholder:text-slate-400"
          />

          <div className="mt-2 max-h-56 overflow-y-auto">
            {!queryLongEnough ? (
              <p className="p-2 text-xs text-slate-400">
                Type at least 2 characters. Use the full email to find someone by email.
              </p>
            ) : isSearching ? (
              <p className="p-2 text-xs text-slate-400">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="p-2 text-xs text-slate-400">No users found</p>
            ) : (
              searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleStartChat(user)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-700"
                >
                  <Avatar user={user} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{displayName(user)}</p>
                    {user.username && (
                      <p className="truncate text-xs text-slate-400">@{user.username}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoadingChats ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
              <div className="h-11 w-11 rounded-full bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-slate-700" />
                <div className="h-3 w-3/4 rounded bg-slate-700" />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">
            No conversations yet. Click + to find someone to chat with.
          </p>
        ) : filteredChats.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No chats found</p>
        ) : (
          filteredChats.map((chat) => {
            const other = getOtherUser(chat, myId)
            const unread = getUnread(chat)
            return (
              <button
                key={chat._id}
                onClick={() => selectChat(chat._id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 ${
                  selectedChatId === chat._id ? 'bg-slate-700' : ''
                }`}
              >
                <Avatar user={other} online={onlineUserIds.includes(other._id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{displayName(other)}</span>
                    <span
                      className={`ml-2 shrink-0 text-xs ${
                        unread > 0 ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {formatChatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`truncate text-sm ${
                        unread > 0 ? 'font-medium text-white' : 'text-slate-400'
                      }`}
                    >
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}

export default Sidebar