import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getShareDoc, verifyPassword, submitEmail } from '../api/share'
import PasswordGate from '../components/share/PasswordGate'
import EmailGate from '../components/share/EmailGate'
import PdfViewer from '../components/share/PdfViewer'

export default function ShareViewer() {
  const { slug } = useParams()
  const [doc, setDoc] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [viewerEmail, setViewerEmail] = useState(null)

  useEffect(() => {
    getShareDoc(slug)
      .then(data => setDoc(data.document))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-white" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4">
        <div className="text-center bg-neutral-800 p-8 rounded-2xl border border-neutral-700 max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-neutral-900 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl text-red-500">&#9888;</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Document Not Available</h1>
          <p className="text-neutral-400 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  // Password gate
  if (doc.requiresPassword && !passwordVerified) {
    return (
      <PasswordGate
        title={doc.title}
        onVerified={async (password) => {
          await verifyPassword(slug, password)
          setPasswordVerified(true)
        }}
      />
    )
  }

  // Email gate
  if (doc.requiresEmail && !viewerEmail) {
    return (
      <EmailGate
        title={doc.title}
        onSubmit={async (email) => {
          await submitEmail(slug, email)
          setViewerEmail(email)
        }}
      />
    )
  }

  // PDF viewer
  return <PdfViewer document={doc} viewerEmail={viewerEmail} />
}
