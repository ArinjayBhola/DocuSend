import { useState, useEffect } from 'react'
import { getPreferences, updatePreferences } from '../api/notifications'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getPreferences()
      .then(data => setPrefs(data.preferences))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (key: string) => {
    const newVal = !prefs[key]
    setPrefs({ ...prefs, [key]: newVal })
    setSaving(true)
    setSaved(false)
    try {
      const data = await updatePreferences({ [key]: newVal })
      setPrefs(data.preferences)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setPrefs({ ...prefs, [key]: !newVal }) // revert
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const toggleItems = [
    {
      key: 'inAppNotifications',
      label: 'In-app notifications',
      description: 'Show notifications in the bell icon when someone views your documents.',
    },
    {
      key: 'emailOnView',
      label: 'Email on document view',
      description: 'Receive an email every time someone starts viewing one of your documents.',
    },
    {
      key: 'emailOnEmailCapture',
      label: 'Email on lead capture',
      description: 'Receive an email when a viewer submits their email address to access your document.',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Notification Settings</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            Control how and when you get notified about document activity.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm divide-y divide-neutral-100">
          {toggleItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between px-6 py-5">
              <div className="pr-4">
                <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                <p className="text-xs font-medium text-neutral-500 mt-0.5">{item.description}</p>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  prefs[item.key] ? 'bg-brand-600' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    prefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {saved && (
          <div className="mt-4 text-center">
            <span className="text-sm font-semibold text-emerald-600">Settings saved</span>
          </div>
        )}
      </div>
    </div>
  )
}
