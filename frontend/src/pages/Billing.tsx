import { useState, useEffect } from 'react'
import { getBilling, subscribe, cancelSubscription, confirmSuccess } from '../api/billing'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Button from '../components/ui/Button'

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  { key: 'free', name: 'Free', price: 0, features: ['5 documents', '100 views/month', 'Basic analytics'] },
  { key: 'pro', name: 'Pro', price: 999, features: ['50 documents', 'Unlimited views', '5 workspaces', 'Full analytics'] },
  { key: 'business', name: 'Business', price: 2999, features: ['Unlimited documents', 'Unlimited views', 'Unlimited workspaces', '10 team seats'] },
]

export default function Billing() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)

  const loadBilling = () => {
    getBilling()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(loadBilling, [])

  const handleSubscribe = async (plan) => {
    setSubscribing(true)
    try {
      const { subscriptionId, razorpayKeyId } = await subscribe(plan)

      if (typeof window.Razorpay === 'undefined') {
        // Load Razorpay script
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
        handler: async (response) => {
          await confirmSuccess({
            razorpay_subscription_id: response.razorpay_subscription_id,
            plan,
          })
          loadBilling()
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#2563eb' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubscribing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will be downgraded to Free.')) return
    try {
      await cancelSubscription()
      loadBilling()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing</h1>
      <p className="text-gray-500 mb-8">
        Current plan: <span className="font-semibold capitalize">{data?.currentPlan}</span>
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isCurrent = data?.currentPlan === plan.key
          return (
            <div key={plan.key} className={`bg-white rounded-xl border-2 p-6 ${isCurrent ? 'border-blue-500' : 'border-gray-200'}`}>
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="text-3xl font-bold text-gray-900 my-3">
                {plan.price === 0 ? 'Free' : `₹${plan.price}/mo`}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                plan.key !== 'free' ? (
                  <Button variant="danger" className="w-full" onClick={handleCancel}>Cancel</Button>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>Current Plan</Button>
                )
              ) : plan.key !== 'free' ? (
                <Button className="w-full" disabled={subscribing} onClick={() => handleSubscribe(plan.key)}>
                  {subscribing ? 'Loading...' : 'Upgrade'}
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
