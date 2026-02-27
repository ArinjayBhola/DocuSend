import { useEffect, useRef } from 'react'

interface Props {
  stream: MediaStream
  userName: string
  onClose?: () => void
}

export default function MediaStreamView({ stream, userName, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      
      {/* Overlay header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">Live</div>
          <span className="text-white font-medium text-sm drop-shadow-md">
            {userName}'s Screen
          </span>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Sharing controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
        <div className="px-4 py-2 bg-neutral-900/80 backdrop-blur-md rounded-full border border-white/10 text-white text-xs flex items-center gap-3">
          <button className="hover:text-blue-400 transition-colors">Enter Fullscreen</button>
          <div className="w-px h-3 bg-white/20" />
          <button className="hover:text-red-400 transition-colors">Report Issue</button>
        </div>
      </div>
    </div>
  )
}
