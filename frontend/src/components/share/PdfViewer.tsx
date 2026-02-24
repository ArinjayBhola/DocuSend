import { useEffect, useRef } from 'react'
import usePdfRenderer from '../../hooks/usePdfRenderer'
import { startView, trackPage, endView } from '../../api/share'
import { startLiveSession, livePageChange, endLiveSession } from '../../api/live'

export default function PdfViewer({ document, viewerEmail }) {
  const pdfUrl = `/api/share/pdf/${document.shareSlug}`
  const { loading, error, numPages, currentPage, currentPageRef, containerRef } = usePdfRenderer(pdfUrl)
  const viewIdRef = useRef(null)
  const pageStartRef = useRef(Date.now())
  const prevPageRef = useRef(1)

  // Start view session once PDF loads
  useEffect(() => {
    if (loading || error || !numPages) return

    let cancelled = false

    async function initTracking() {
      try {
        const { viewId } = await startView({
          documentId: document.id,
          viewerEmail: viewerEmail || null,
          totalPages: numPages,
        })
        if (cancelled) return
        viewIdRef.current = viewId
        startLiveSession({ viewId, documentId: document.id, viewerEmail: viewerEmail || null, totalPages: numPages }).catch(() => {})
      } catch (err) {
        console.error('Failed to start view tracking:', err)
      }
    }

    initTracking()

    return () => {
      cancelled = true
      if (viewIdRef.current) {
        const timeSpent = Date.now() - pageStartRef.current
        endView({ viewId: viewIdRef.current, pageNumber: currentPageRef.current, timeSpent })
        endLiveSession({ viewId: viewIdRef.current })
      }
    }
  }, [loading, error, numPages, document, viewerEmail])

  // Track page changes
  useEffect(() => {
    if (currentPage === prevPageRef.current) return
    const timeSpent = Date.now() - pageStartRef.current
    if (viewIdRef.current && timeSpent > 500) {
      trackPage({ viewId: viewIdRef.current, pageNumber: prevPageRef.current, timeSpent })
      livePageChange({ viewId: viewIdRef.current, pageNumber: currentPage, timeSpent }).catch(() => {})
    }
    prevPageRef.current = currentPage
    pageStartRef.current = Date.now()
  }, [currentPage])

  return (
    <div className="min-h-screen bg-neutral-900 selection:bg-brand-500/30">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 text-white px-6 py-4 flex items-center justify-between z-50 shadow-sm">
        <span className="font-semibold tracking-tight truncate pr-4">{document?.title || 'Loading Document...'}</span>
        <span className="text-xs font-bold tracking-widest uppercase text-neutral-400 shrink-0 bg-neutral-800 px-3 py-1.5 rounded-md">
          {loading ? 'WAIT' : `P. ${currentPage} / ${numPages}`}
        </span>
      </div>

      {/* PDF pages */}
      <div ref={containerRef} className="pt-24 pb-12 px-4 flex flex-col items-center gap-6" />

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 h-full">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-800 border-t-white mb-6" />
          <p className="text-neutral-400 font-medium tracking-tight">Preparing document...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-32 px-4">
           <div className="bg-neutral-800 border border-neutral-700 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <span className="text-2xl">&#9888;</span>
              </div>
              <p className="text-xl font-bold text-white mb-2">Error loading PDF</p>
              <p className="text-neutral-400 text-sm">{error}</p>
           </div>
        </div>
      )}
    </div>
  )
}
