import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { useChatStore } from '../stores/useChatStore'
import { useUserStore } from '../stores/useUserStore'
import { displayName, formatTime, getOtherUser } from '../lib/utils'
import Avatar from './Avatar'
import MessageInput from './MessageInput'
import { useSocketStore } from '../stores/useSocketStore'

// Photo inside a bubble: shows a gray placeholder until it has loaded
function ChatImage({ src, onOpen, onLoaded }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className={`block ${
        loaded ? 'w-full' : 'h-48 w-56 animate-pulse bg-slate-600/60'
      }`}
    >
      <img
        src={src}
        alt="Sent photo"
        loading="lazy"
        onLoad={() => {
          setLoaded(true)
          onLoaded?.()
        }}
        className={`max-h-72 w-full cursor-zoom-in object-cover ${
          loaded ? '' : 'invisible'
        }`}
      />
    </button>
  )
}

function ChatWindow() {
  const currentUser = useUserStore((s) => s.currentUser)
  const selectedChatId = useChatStore((s) => s.selectedChatId)
  const conversations = useChatStore((s) => s.conversations)
  const messages = useChatStore((s) => s.messages)
  const clearSelectedChat = useChatStore((s) => s.clearSelectedChat)
  const onlineUserIds = useSocketStore((s) => s.onlineUserIds)

  const [viewerUrl, setViewerUrl] = useState('')

  const chat = conversations.find((c) => c._id === selectedChatId)
  const chatMessages = messages[selectedChatId]

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages?.length, selectedChatId])

  // Close the photo viewer with the Escape key
  useEffect(() => {
    if (!viewerUrl) return
    const onKey = (e) => {
      if (e.key === 'Escape') setViewerUrl('')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerUrl])

  // Close the viewer when switching chats
  useEffect(() => {
    setViewerUrl('')
  }, [selectedChatId])

  if (!chat || !currentUser) return null

  const other = getOtherUser(chat, currentUser._id)
  const isOnline = onlineUserIds.includes(other._id)
  const lastId = chatMessages?.[chatMessages.length - 1]?._id

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-slate-700 bg-slate-800 p-4">
        <button onClick={clearSelectedChat} className="md:hidden">
          <ArrowLeft size={22} />
        </button>
        <Avatar user={other} size={40} online={isOnline} />
        <div>
          <h2 className="font-semibold leading-tight">{displayName(other)}</h2>
          <p className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {chatMessages === undefined ? (
          <p className="mt-10 text-center text-sm text-slate-400">Loading messages...</p>
        ) : chatMessages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-400">
            No messages yet. Say hello!
          </p>
        ) : (
          chatMessages.map((msg) => {
            const mine = msg.senderId === currentUser._id
            const isImage = msg.mediaUrl && msg.mediaType === 'image'
            const isVideo = msg.mediaUrl && msg.mediaType === 'video'
            const hasMedia = isImage || isVideo
            const imageOnly = isImage && !msg.text
            return (
              <div
                key={msg._id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-xs overflow-hidden rounded-2xl md:max-w-md ${
                    mine ? 'bg-emerald-600' : 'bg-slate-700'
                  } ${hasMedia ? '' : 'px-4 py-2'}`}
                >
                  {isImage && (
                    <ChatImage
                      src={msg.mediaUrl}
                      onOpen={setViewerUrl}
                      onLoaded={() => {
                        // keep the newest photo in view once it has loaded
                        if (msg._id === lastId) {
                          bottomRef.current?.scrollIntoView({ behavior: 'auto' })
                        }
                      }}
                    />
                  )}

                  {isVideo && (
                    <video
                      // asking Cloudinary for .mp4 makes MOV/WEBM files play in every browser
                      src={msg.mediaUrl.replace(/\.[^./]+$/, '.mp4')}
                      controls
                      preload="metadata"
                      className="max-h-72 w-full bg-black"
                    />
                  )}

                  {imageOnly ? (
                    // photo with no caption: time sits on top of the photo
                    <span className="absolute bottom-1.5 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                      {formatTime(msg.createdAt)}
                    </span>
                  ) : (
                    <div className={hasMedia ? 'px-3 py-2' : ''}>
                      {msg.text && <p className="wrap-break">{msg.text}</p>}
                      <span className="mt-1 block text-right text-xs text-slate-300">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput />

      {viewerUrl && (
        <div
          onClick={() => setViewerUrl('')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <button
            type="button"
            onClick={() => setViewerUrl('')}
            title="Close"
            className="absolute right-4 top-4 rounded-full bg-slate-800 p-2 text-slate-200 hover:text-white"
          >
            <X size={22} />
          </button>
          <img
            src={viewerUrl}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  )
}

export default ChatWindow