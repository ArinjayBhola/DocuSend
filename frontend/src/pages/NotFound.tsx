import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-32 text-center">
      <h1 className="text-6xl font-extrabold text-neutral-200 mb-4 tracking-tight">404</h1>
      <p className="text-xl font-medium text-neutral-600 mb-8">Page not found</p>
      <Link to="/" className="text-brand-600 font-semibold hover:underline underline-offset-4">Return Home</Link>
    </div>
  )
}
