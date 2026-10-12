import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import EmptyChat from '../components/EmptyChat'
import { useChatStore } from '../stores/useChatStore'

function HomePage() {
  const selectedChatId = useChatStore((s) => s.selectedChatId)

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <div className={`${selectedChatId ? 'hidden' : 'flex'} w-full md:flex md:w-80`}>
        <Sidebar />
      </div>

      <main className={`${selectedChatId ? 'flex' : 'hidden'} flex-1 md:flex`}>
        {selectedChatId ? <ChatWindow /> : <EmptyChat />}
      </main>
    </div>
  )
}

export default HomePage