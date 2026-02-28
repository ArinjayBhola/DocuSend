import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../notifications/NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Smart Links', href: '/smartlinks' },
    { name: 'Workspaces', href: '/workspaces' },
    { name: 'Leads', href: '/leads' },
    { name: 'Engagement', href: '/engagement' },
    { name: 'Deals', href: '/deals' },
    { name: 'Sessions', href: '/sessions' },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                DocuSend
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/live" 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    isActive('/live') 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live
                </Link>
                
                <NotificationBell />
                
                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    <span className="text-xs font-semibold text-slate-600">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Log in</Link>
                <Link to="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
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
