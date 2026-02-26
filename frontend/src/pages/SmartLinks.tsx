import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { listSmartLinks } from '../api/smartlinks'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import LinkCard from '../components/smartlinks/LinkCard'
import CreateLinkModal from '../components/smartlinks/CreateLinkModal'

export default function SmartLinks() {
  const { user } = useAuth()
  const [links, setLinks] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all')
  const [search, setSearch] = useState('')

  const isFree = user?.plan === 'free'
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchLinks = () => {
    if (isFree) {
      setLoading(false)
      return
    }
    setLoading(true)
    listSmartLinks({ limit: 200 })
      .then((data: any) => {
        setLinks(data.links || [])
        setTotal(data.total || 0)
      })
      .catch((err: any) => setError(err.message || 'Failed to load smart links'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLinks()
  }, [isFree, refreshKey])

  const handleRefresh = () => setRefreshKey(k => k + 1)

  if (loading) return <LoadingSpinner />

  // Free plan gate
  if (isFree) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-100 shadow-sm">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Smart Links</h3>
            <p className="text-sm text-neutral-500 font-medium mb-6 max-w-md mx-auto">
              Create personalized trackable links for each recipient. Know exactly who opened your document, when, and how they engaged.
            </p>
            <Link
              to="/billing"
              className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="max-w-7xl mx-auto text-center py-24">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const activeLinks = links.filter(l => l.isActive)
  const revokedLinks = links.filter(l => !l.isActive)
  const viewedLinks = links.filter(l => l.viewCount > 0)

  let filteredLinks = links
  if (filter === 'active') filteredLinks = activeLinks
  if (filter === 'revoked') filteredLinks = revokedLinks

  if (search) {
    filteredLinks = filteredLinks.filter(l =>
      l.recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
      (l.recipientName && l.recipientName.toLowerCase().includes(search.toLowerCase())) ||
      l.documentTitle.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Smart Links</h1>
            <p className="text-sm font-medium text-neutral-500 mt-1">
              {total} link{total !== 1 ? 's' : ''} created
              {user?.plan === 'pro' && ` / 25 limit`}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            Create Smart Link
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Links</p>
            <p className="text-3xl font-extrabold text-neutral-900 mt-1">{total}</p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{activeLinks.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Viewed</p>
            <p className="text-3xl font-extrabold text-neutral-900 mt-1">{viewedLinks.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Views</p>
            <p className="text-3xl font-extrabold text-neutral-900 mt-1">
              {links.reduce((sum, l) => sum + l.viewCount, 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-neutral-100 rounded-lg p-1 w-fit">
            {(['all', 'active', 'revoked'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by email, name, or document..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* Links grid */}
        {filteredLinks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100 shadow-sm">
            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {search ? 'No links match your search' : 'No smart links yet'}
            </h3>
            <p className="text-sm text-neutral-500 font-medium mb-6">
              {search ? 'Try a different search term.' : 'Create your first smart link to start tracking individual recipients.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-brand-600 font-semibold hover:text-brand-700 hover:underline underline-offset-4 transition-all"
              >
                Create your first smart link
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLinks.map((link: any) => (
              <LinkCard key={link.id} link={link} onRefresh={handleRefresh} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateLinkModal
          onClose={() => setShowCreate(false)}
          onCreate={() => {
            setShowCreate(false)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}
