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
  collapsed: boolean
  onToggle: () => void
  unreadCount: number
}

export default function ChatPanel({ messages, currentUserId, typingUsers, onSend, onTyping, collapsed, onToggle, unreadCount }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, typingUsers, collapsed])

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

  // Collapsed state — narrow strip
  if (collapsed) {
    return (
      <div className="w-12 bg-white border-l border-neutral-200 flex flex-col items-center py-3 shrink-0 transition-all duration-300">
        <button
          onClick={onToggle}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
          title="Open chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  // Expanded state
  return (
    <div className="w-80 bg-white border-l border-neutral-200 flex flex-col h-full shrink-0 transition-all duration-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Chat</h3>
        <button
          onClick={onToggle}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          title="Collapse chat"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
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
