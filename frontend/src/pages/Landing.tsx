import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Landing() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center pt-24 pb-20 relative overflow-hidden">
      {/* Decorative Solid Shapes */}
      <div className="absolute top-0 right-0 -mr-40 -mt-20 w-[600px] h-[600px] bg-brand-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-20 w-[500px] h-[500px] bg-brand-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200">
          <span className="text-sm font-semibold tracking-wide text-brand-700 uppercase">
            Smarter Document Sharing
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold text-neutral-900 tracking-tight leading-tight mb-8">
          Share Documents.<br />
          <span className="text-brand-600">Track Everything.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-neutral-600 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
          Upload PDFs, share secure links, and see exactly who viewed your documents,
          which pages they read, and how long they spent.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mt-10">
          <Link
            to="/register"
            className="flex items-center justify-center bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-xl shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-1 transition-all duration-300 active:scale-95"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center bg-white text-neutral-700 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-neutral-200 shadow-sm hover:border-neutral-300 hover:bg-neutral-50 hover:-translate-y-1 transition-all duration-300 active:scale-95"
          >
            Sign In to Dashboard
          </Link>
        </div>

        <div className="mt-32 grid md:grid-cols-3 gap-8 text-left">
          
          <div className="group bg-white p-8 rounded-2xl shadow-lg border border-neutral-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:bg-brand-700 transition-colors duration-300">
              <span className="text-2xl text-white">&#128196;</span>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight">Secure Sharing</h3>
            <p className="text-neutral-600 leading-relaxed font-medium">
              Enterprise-grade password protection, email lead gates, and precise expiration dates for your sensitive documents.
            </p>
          </div>

          <div className="group bg-brand-900 p-8 rounded-2xl shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
             {/* Subtle internal decoration */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none" />
            
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors duration-300">
              <span className="text-2xl text-white">&#128200;</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Page-Level Analytics</h3>
            <p className="text-brand-100 leading-relaxed font-medium">
              Know exactly which pages get the most attention and how long viewers spend reading them.
            </p>
          </div>

          <div className="group bg-white p-8 rounded-2xl shadow-lg border border-neutral-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-brand-100 border border-brand-200 rounded-xl flex items-center justify-center mb-6 focus-within: shadow-inner group-hover:bg-brand-200 transition-colors duration-300">
              <span className="text-2xl text-brand-700">&#128193;</span>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight">Custom Workspaces</h3>
            <p className="text-neutral-600 leading-relaxed font-medium">
              Organize related documents into secure deal rooms. Share entire collections with a single smart link.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
