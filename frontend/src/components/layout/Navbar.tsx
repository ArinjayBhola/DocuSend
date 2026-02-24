import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-md border-b border-neutral-200/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 transition-transform duration-300 group-hover:-translate-y-0.5 shadow-md shadow-brand-600/20 flex items-center justify-center">
              <span className="text-white font-bold leading-none select-none">D</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900">
              DocuSend
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Dashboard</Link>
                <Link to="/workspaces" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Workspaces</Link>
                <Link to="/billing" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Billing</Link>
                
                <div className="h-6 w-px bg-neutral-200 mx-2"></div>
                
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-neutral-600">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-brand-700 transition-colors">Log in</Link>
                <Link to="/register" className="text-sm font-medium bg-brand-600 text-white px-5 py-2.5 rounded-lg shadow-md shadow-brand-600/20 hover:bg-brand-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
