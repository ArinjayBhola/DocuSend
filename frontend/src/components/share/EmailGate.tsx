import { useState } from 'react'
import Button from '../ui/Button'

export default function EmailGate({ title, onSubmit }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(email)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 flex flex-col justify-center bg-neutral-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-1 bg-brand-600"></div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 line-clamp-2" title={title}>{title}</h2>
            <p className="mt-2 text-sm text-neutral-500 font-medium">Please enter your email to view this document.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 shadow-sm"
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'View Document'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
