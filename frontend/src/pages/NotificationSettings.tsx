import { useState, useEffect } from 'react'
import { Bell, Mail, Target, CheckCircle2, ShieldCheck } from 'lucide-react'
import { getPreferences, updatePreferences } from '../api/notifications'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import SectionHeader from '../components/ui/SectionHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

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
    const oldPrefs = { ...prefs }
    setPrefs({ ...oldPrefs, [key]: newVal })
    setSaving(true)
    setSaved(false)
    try {
      const data = await updatePreferences({ [key]: newVal })
      setPrefs(data.preferences)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setPrefs(oldPrefs) // revert
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <LoadingSpinner />
    </div>
  )

  const toggleItems = [
    {
      key: 'inAppNotifications',
      label: 'In-app notifications',
      description: 'Show notifications in the bell icon when someone views your documents.',
      icon: Bell,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50'
    },
    {
      key: 'emailOnView',
      label: 'Email on document view',
      description: 'Receive an email every time someone starts viewing one of your documents.',
      icon: Mail,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      key: 'emailOnEmailCapture',
      label: 'Email on lead capture',
      description: 'Receive an email when a viewer submits their email address to access your document.',
      icon: Target,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <SectionHeader 
        title="Notification Settings" 
        description="Control how and when you get notified about document activity and recipient engagement."
      />

      <div className="grid grid-cols-1 gap-8">
        <Card padding="none" className="overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-neutral-50 rounded-lg text-neutral-500 border border-neutral-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Preferences</h3>
            </div>
            {saved && (
              <Badge variant="success" size="sm" className="animate-in fade-in slide-in-from-right-4 duration-300">
                <CheckCircle2 className="w-3 h-3 mr-1" /> All changes saved
              </Badge>
            )}
          </div>

          <div className="divide-y divide-neutral-100">
            {toggleItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between px-8 py-6 group hover:bg-neutral-50/50 transition-colors">
                <div className="flex items-start gap-4 pr-6">
                  <div className={`mt-0.5 p-2 rounded-xl border border-transparent group-hover:border-neutral-200 group-hover:bg-white transition-all ${item.bgColor} ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-neutral-900 leading-tight mb-1">{item.label}</p>
                    <p className="text-[13px] font-medium text-neutral-500 leading-relaxed max-w-lg">{item.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggle(item.key)}
                  disabled={saving}
                  className={`relative inline-flex h-6.5 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10 ${
                    prefs[item.key] ? 'bg-brand-600 shadow-sm shadow-brand-600/30' : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      prefs[item.key] ? 'translate-x-6.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md" className="bg-neutral-50/50 border-dashed border-neutral-200">
          <div className="flex items-center gap-4 text-neutral-500">
            <div className="p-2 bg-white rounded-lg border border-neutral-100">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium leading-relaxed">
              We'll soon be adding support for Slack and MS Teams notifications. 
              <span className="text-brand-600 font-bold ml-1 cursor-pointer hover:underline">Vote for integrations &rarr;</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
