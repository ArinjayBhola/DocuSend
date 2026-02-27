import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export default function usePdfRenderer(pdfUrl: string, scale: number = 1.0) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map())
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentPageRef = useRef(1)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        setLoading(true)
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise
        if (cancelled) return

        setNumPages(pdf.numPages)
        setLoading(false)

        const container = containerRef.current
        if (!container) return
        container.innerHTML = ''
        pageRefsMap.current.clear()

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale })

          const wrapper = document.createElement('div')
          wrapper.className = 'pdf-page bg-white p-1 rounded-sm shadow-2xl relative transition-all duration-300'
          wrapper.dataset.page = i.toString()
          wrapper.style.width = `${viewport.width}px`
          wrapper.style.height = `${viewport.height}px`

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          wrapper.appendChild(canvas)
          container.appendChild(wrapper)

          pageRefsMap.current.set(i, wrapper)

          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
          await page.render({ canvasContext: ctx, canvas, viewport }).promise
        }

        // Observe page visibility
        const observer = new IntersectionObserver((entries) => {
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          if (visible.length > 0) {
            const pageNum = parseInt((visible[0].target as HTMLElement).dataset.page!)
            if (pageNum !== currentPageRef.current) {
              currentPageRef.current = pageNum
              setCurrentPage(pageNum)
            }
          }
        }, { threshold: 0.1 })

        observerRef.current = observer
        container.querySelectorAll('.pdf-page').forEach(el => observer.observe(el))
      } catch (err: any) {
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
      observerRef.current?.disconnect()
    }
  }, [pdfUrl, scale])

  return {
    loading,
    error,
    numPages,
    currentPage,
    setCurrentPage,
    currentPageRef,
    containerRef,
    pageRefsMap,
  }
}
