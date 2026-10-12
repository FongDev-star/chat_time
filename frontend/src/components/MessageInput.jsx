import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Paperclip, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useChatStore } from '../stores/useChatStore'

const MAX_LENGTH = 500
const MAX_IMAGE_MB = 10
const MAX_VIDEO_MB = 50
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

function MessageInput() {
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef(null)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const uploadMedia = useChatStore((s) => s.uploadMedia)

  // Local preview of the chosen file, released when it changes
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handlePick = (e) => {
    const picked = e.target.files?.[0]
    e.target.value = '' // so choosing the same file again still works
    if (!picked) return

    if (!ALLOWED_TYPES.includes(picked.type)) {
      toast.error('Use JPG, PNG, WEBP, GIF, MP4, WEBM or MOV')
      return
    }
    const isImage = picked.type.startsWith('image/')
    const maxMb = isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB
    if (picked.size > maxMb * 1024 * 1024) {
      toast.error(`${isImage ? 'Photos' : 'Videos'} can be up to ${maxMb} MB`)
      return
    }
    setFile(picked)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if ((!trimmed && !file) || isSending) return

    if (trimmed.length > MAX_LENGTH) {
      toast.error(`Message is too long (max ${MAX_LENGTH} characters)`)
      return
    }

    setIsSending(true)
    try {
      let media
      if (file) {
        media = await uploadMedia(file)
        if (!media) return // the store already showed an error toast
      }
      const ok = await sendMessage(trimmed, media)
      if (ok) {
        setText('')
        setFile(null)
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="border-t border-slate-700 bg-slate-800">
      {file && (
        <div className="flex items-center gap-3 px-3 pt-3">
          <div className="relative">
            {file.type.startsWith('video/') ? (
              <video
                src={previewUrl}
                muted
                className="h-20 w-20 rounded-lg object-cover"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Selected file"
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            {!isSending && (
              <button
                type="button"
                onClick={() => setFile(null)}
                title="Remove"
                className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-slate-300 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <p className="min-w-0 truncate text-xs text-slate-400">
            {isSending ? 'Uploading...' : file.name}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handlePick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          title="Attach photo or video"
          className="rounded-full p-2 text-slate-400 hover:text-white disabled:opacity-40"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={file ? 'Add a caption...' : 'Type a message...'}
          className="flex-1 rounded-full bg-slate-700 px-4 py-2 text-sm outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !file) || isSending}
          className="rounded-full bg-emerald-600 p-2 hover:bg-emerald-500 disabled:opacity-40"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  )
}

export default MessageInput