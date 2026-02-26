import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getEngagementScores, getFollowUpSuggestions, getDocumentPerformance } from '../api/engagement'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ScoreCard from '../components/engagement/ScoreCard'
import ScoreBadge from '../components/engagement/ScoreBadge'
import FollowUpList from '../components/engagement/FollowUpList'
import DocumentPerformance from '../components/engagement/DocumentPerformance'
import EngagementChart from '../components/engagement/EngagementChart'

type Tab = 'overview' | 'scores' | 'followups' | 'performance'

export default function Engagement() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [scores, setScores] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [totalScores, setTotalScores] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [classFilter, setClassFilter] = useState<string>('')

  const isFree = user?.plan === 'free'

  useEffect(() => {
    if (isFree) {
      setLoading(false)
      return
    }

    Promise.all([
      getEngagementScores({ limit: 100 }),
      getFollowUpSuggestions({ limit: 50 }),
      getDocumentPerformance({ limit: 20 }),
    ])
      .then(([scoresData, followUpsData, perfData]) => {
        setScores(scoresData.scores || [])
        setTotalScores(scoresData.total || 0)
        setSuggestions(followUpsData.suggestions || [])
        setDocuments(perfData.documents || [])
      })
      .catch((err) => setError(err.message || 'Failed to load engagement data'))
      .finally(() => setLoading(false))
  }, [isFree])

  if (loading) return <LoadingSpinner />

  // Free plan gate
  if (isFree) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-100 shadow-sm">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Engagement Scoring</h3>
            <p className="text-sm text-neutral-500 font-medium mb-6 max-w-md mx-auto">
              Turn raw document views into actionable intelligence. Score viewers, identify hot leads, and get smart follow-up suggestions.
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

  const hotCount = scores.filter(s => s.classification === 'hot').length
  const warmCount = scores.filter(s => s.classification === 'warm').length
  const highPriority = suggestions.filter(s => s.priority === 'high').length

  const filteredScores = classFilter
    ? scores.filter(s => s.classification === classFilter)
    : scores

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'scores', label: `Scores (${totalScores})` },
    { key: 'followups', label: `Follow-Ups (${suggestions.length})` },
    { key: 'performance', label: 'Documents' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Engagement</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            AI-powered lead scoring and follow-up recommendations
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Viewers</p>
            <p className="text-3xl font-extrabold text-neutral-900 mt-1">{totalScores}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Hot Leads</p>
            <p className="text-3xl font-extrabold text-red-600 mt-1">{hotCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Warm Leads</p>
            <p className="text-3xl font-extrabold text-orange-600 mt-1">{warmCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Action Items</p>
            <p className="text-3xl font-extrabold text-neutral-900 mt-1">{highPriority}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-neutral-100 rounded-lg p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <EngagementChart scores={scores} />

            {/* Top follow-ups */}
            {suggestions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-neutral-900">Priority Follow-Ups</h3>
                  <button
                    onClick={() => setTab('followups')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View all
                  </button>
                </div>
                <FollowUpList suggestions={suggestions.slice(0, 5)} />
              </div>
            )}

            {/* Top scored viewers */}
            {scores.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-neutral-900">Top Engaged Viewers</h3>
                  <button
                    onClick={() => setTab('scores')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View all
                  </button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scores.slice(0, 6).map((s: any) => (
                    <ScoreCard key={`${s.viewerEmail}-${s.documentId}`} score={s} />
                  ))}
                </div>
              </div>
            )}

            {scores.length === 0 && suggestions.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">No engagement data yet</h3>
                <p className="text-sm text-neutral-500 font-medium">
                  Share your documents with email gating enabled to start scoring viewers
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'scores' && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {['', 'hot', 'warm', 'interested', 'cold'].map(f => (
                <button
                  key={f}
                  onClick={() => setClassFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    classFilter === f
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScores.map((s: any) => (
                <ScoreCard key={`${s.viewerEmail}-${s.documentId}`} score={s} />
              ))}
            </div>
            {filteredScores.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-neutral-100 shadow-sm">
                <p className="text-sm font-semibold text-neutral-900">No viewers in this category</p>
              </div>
            )}
          </div>
        )}

        {tab === 'followups' && <FollowUpList suggestions={suggestions} />}

        {tab === 'performance' && <DocumentPerformance documents={documents} />}
      </div>
    </div>
  )
}
