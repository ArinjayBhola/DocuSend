import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-neutral-100 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-1 bg-brand-600"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Create an account</h1>
            <p className="mt-2 text-sm text-neutral-500 font-medium">Start sharing and tracking your documents.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="text-red-500 text-lg">&#9888;</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full name"
              required
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e: any) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email address"
              type="email"
              required
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e: any) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={form.password}
              onChange={(e: any) => setForm({ ...form, password: e.target.value })}
            />
            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-neutral-500">
            Already have an account?{' '}
             <Link to="/login" className="text-brand-600 hover:text-brand-700 hover:underline underline-offset-4 transition-all">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
