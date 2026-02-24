import { useState, useRef, useEffect } from 'react'

interface Message {
  id: number
  userId: number
  userName: string
  content: string
  createdAt: string
}

interface Props {
  messages: Message[]
  currentUserId: number
  typingUsers: { userId: number; name: string }[]
  onSend: (content: string) => void
  onTyping: (isTyping: boolean) => void
}

export default function ChatPanel({ messages, currentUserId, typingUsers, onSend, onTyping }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
    onTyping(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    onTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="w-80 bg-white border-l border-neutral-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map(msg => {
          const isMe = msg.userId === currentUserId
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-[10px] font-medium text-neutral-500 mb-0.5 ml-1">{msg.userName}</span>
              )}
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                isMe
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-neutral-100 text-neutral-800 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5 mx-1">{formatTime(msg.createdAt)}</span>
            </div>
          )
        })}

        {typingUsers.length > 0 && (
          <div className="text-xs text-neutral-400 italic">
            {typingUsers.map(u => u.name.split(' ')[0]).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
