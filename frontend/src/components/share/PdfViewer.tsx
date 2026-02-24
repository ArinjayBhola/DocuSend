import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { startView, trackPage, endView } from '../../api/share'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export default function PdfViewer({ document, viewerEmail }) {
  const containerRef = useRef(null)
  const viewIdRef = useRef(null)
  const currentPageRef = useRef(1)
  const pageStartRef = useRef(Date.now())
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        const pdfUrl = `/api/share/pdf/${document.shareSlug}`
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise
        if (cancelled) return

        setNumPages(pdf.numPages)
        setLoading(false)

      // Start view session
      const { viewId } = await startView({
        documentId: document.id,
        viewerEmail: viewerEmail || null,
        totalPages: pdf.numPages,
      })
      viewIdRef.current = viewId

      // Render all pages
      const container = containerRef.current
      container.innerHTML = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })

        const wrapper = window.document.createElement('div')
        wrapper.className = 'pdf-page bg-white p-1 rounded-sm shadow-2xl'
        wrapper.dataset.page = i.toString()
        wrapper.style.width = `${viewport.width}px`

        const canvas = window.document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        wrapper.appendChild(canvas)
        container.appendChild(wrapper)

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        await page.render({ canvasContext: ctx, canvas: canvas, viewport }).promise
      }

      // Observe page visibility
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) {
          const pageNum = parseInt((visible[0].target as HTMLElement).dataset.page!)
          if (pageNum !== currentPageRef.current) {
            // Track time on previous page
            const timeSpent = Date.now() - pageStartRef.current
            if (viewIdRef.current && timeSpent > 500) {
              trackPage({ viewId: viewIdRef.current, pageNumber: currentPageRef.current, timeSpent })
            }
            currentPageRef.current = pageNum
            pageStartRef.current = Date.now()
            setCurrentPage(pageNum)
          }
        }
      }, { threshold: 0.5 })

      container.querySelectorAll('.pdf-page').forEach(el => observer.observe(el))

      return () => observer.disconnect()
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load PDF:', err)
          setError(err.message || 'Failed to load document')
          setLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      cancelled = true
      // Send final page event
      if (viewIdRef.current) {
        const timeSpent = Date.now() - pageStartRef.current
        endView({ viewId: viewIdRef.current, pageNumber: currentPageRef.current, timeSpent })
      }
    }
  }, [document, viewerEmail])

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
