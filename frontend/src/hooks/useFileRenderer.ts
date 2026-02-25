import { useEffect, useRef, useState } from 'react'
import usePdfRenderer from './usePdfRenderer'

function useImageRenderer(imageUrl: string, scale: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentPageRef = useRef(1)

  useEffect(() => {
    if (!imageUrl) return

    const container = containerRef.current
    if (!container) return

    setLoading(true)
    setError(null)
    container.innerHTML = ''
    pageRefsMap.current.clear()

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const width = img.naturalWidth * scale
      const height = img.naturalHeight * scale

      const wrapper = document.createElement('div')
      wrapper.className = 'pdf-page bg-white p-1 rounded-sm shadow-2xl relative transition-all duration-300'
      wrapper.dataset.page = '1'
      wrapper.style.width = `${width}px`
      wrapper.style.height = `${height}px`

      const displayImg = document.createElement('img')
      displayImg.src = imageUrl
      displayImg.style.width = '100%'
      displayImg.style.height = '100%'
      displayImg.style.objectFit = 'contain'
      displayImg.draggable = false

      wrapper.appendChild(displayImg)
      container.appendChild(wrapper)
      pageRefsMap.current.set(1, wrapper)

      setLoading(false)
    }

    img.onerror = () => {
      setError('Failed to load image')
      setLoading(false)
    }

    img.src = imageUrl
  }, [imageUrl, scale])

  return {
    loading,
    error,
    numPages: 1,
    currentPage: 1,
    setCurrentPage: () => {},
    currentPageRef,
    containerRef,
    pageRefsMap,
  }
}

export default function useFileRenderer(fileUrl: string, fileType: string, scale: number = 1.5) {
  const isPdf = fileType !== 'image'
  const pdfResult = usePdfRenderer(isPdf ? fileUrl : '', scale)
  const imageResult = useImageRenderer(!isPdf ? fileUrl : '', scale)

  return isPdf ? pdfResult : imageResult
}
