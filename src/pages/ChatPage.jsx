import ChatUI from '../components/chat/ChatUI'
import { useSessionTracker } from '../hooks/useSessionTracker'

export default function ChatPage() {
    useSessionTracker()
    return (
        <div className="h-full flex flex-col">
            <ChatUI />
        </div>
    )
}
