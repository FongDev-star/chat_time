import { MessageCircle } from 'lucide-react'

function EmptyChat() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
      <MessageCircle size={56} className="text-emerald-400" />
      <h2 className="text-xl font-semibold text-white">Welcome to ChatTime</h2>
      <p className="text-sm">Select a conversation to start chatting</p>
    </div>
  )
}

export default EmptyChat