import { useState, useEffect } from 'react'
import { Check, ShieldCheck, Zap, Crown, User, AlertCircle, CreditCard } from 'lucide-react'
import { getBilling, subscribe, cancelSubscription, confirmSuccess } from '../api/billing'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import Badge from '../components/ui/Badge'

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  { 
    key: 'free', 
    name: 'Free', 
    price: 0, 
    icon: User,
    color: 'text-neutral-500',
    description: 'Perfect for individuals getting started with document tracking.',
    features: ['5 documents', '100 views / month', 'Basic analytics', 'Email notifications'] 
  },
  { 
    key: 'pro', 
    name: 'Pro', 
    price: 999, 
    icon: Zap,
    color: 'text-brand-600',
    popular: true,
    description: 'Everything you need to scale your document engagement.',
    features: ['50 documents', 'Unlimited views', '5 workspaces', 'Advanced analytics', 'Custom branding'] 
  },
  { 
    key: 'business', 
    name: 'Business', 
    price: 2999, 
    icon: Crown,
    color: 'text-amber-500',
    description: 'For teams that need maximum control and collaboration.',
    features: ['Unlimited documents', 'Unlimited views', 'Unlimited workspaces', '10 team seats', 'Priority support'] 
  },
]

export default function Billing() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)

  const loadBilling = () => {
    getBilling()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(loadBilling, [])

  const handleSubscribe = async (plan: string) => {
    setSubscribing(true)
    try {
      const { subscriptionId, razorpayKeyId } = await subscribe(plan)

      if (typeof window.Razorpay === 'undefined') {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        document.head.appendChild(script)
        await new Promise(resolve => { script.onload = resolve })
      }

      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: 'DocuSend',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        handler: async (response: any) => {
          await confirmSuccess({
            razorpay_subscription_id: response.razorpay_subscription_id,
            plan,
          })
          loadBilling()
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#4f46e5' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubscribing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will be downgraded to Free at the end of the billing cycle.')) return
    try {
      await cancelSubscription()
      loadBilling()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <LoadingSpinner />
    </div>
  )

  return (
    <div className="space-y-10">
      <SectionHeader 
        title="Billing & Subscription" 
        description="Manage your current plan, view invoices, and upgrade for more power."
      />

      <Card padding="md" className="bg-brand-50/50 border-brand-100 mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl border border-brand-100 shadow-sm text-brand-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Current Plan</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-neutral-900 capitalize leading-none">{data?.currentPlan}</h3>
                <Badge variant="brand" size="sm">Active</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {data?.currentPlan !== 'free' && (
               <Button variant="secondary" onClick={handleCancel}>Cancel Subscription</Button>
             )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map(plan => {
          const isCurrent = data?.currentPlan === plan.key
          return (
            <Card 
              key={plan.key} 
              padding="none" 
              className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${isCurrent ? 'ring-2 ring-brand-600 shadow-xl scale-[1.02] z-10' : 'border-neutral-200'}`}
            >
              {plan.popular && (
                <div className="bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 text-center">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl bg-neutral-50 border border-neutral-100 shadow-sm ${plan.color}`}>
                    <plan.icon className="w-6 h-6" />
                  </div>
                  {isCurrent && (
                    <Badge variant="success" size="sm">Current Plan</Badge>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                <p className="text-[13px] font-medium text-neutral-500 mb-6 leading-relaxed">
                  {plan.description}
                </p>
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black text-neutral-900 leading-none">
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm font-bold text-neutral-400">/mo</span>
                  )}
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map(f => (
                    <li key={f} className="text-[13px] font-bold text-neutral-600 flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full h-12 rounded-xl" disabled>
                      Selected
                    </Button>
                  ) : (
                    <Button 
                      variant={plan.popular ? 'primary' : 'secondary'} 
                      className={`w-full h-12 rounded-xl border-2 ${!plan.popular ? 'border-neutral-200' : ''}`}
                      disabled={subscribing} 
                      onClick={() => handleSubscribe(plan.key)}
                    >
                      {subscribing ? 'Processing...' : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card padding="md" className="bg-neutral-50 border-dashed border-neutral-200 mt-12">
        <div className="flex items-center gap-4 text-neutral-500">
          <div className="p-2 bg-white rounded-lg border border-neutral-100">
            <CreditCard className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium leading-relaxed">
            Need a custom plan for your organization? <span className="text-brand-600 font-bold ml-1 cursor-pointer hover:underline">Contact our sales team &rarr;</span>
          </p>
        </div>
      </Card>
    </div>
  )
}
