export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 grayscale opacity-80">
          <div className="w-5 h-5 rounded overflow-hidden bg-neutral-900 flex items-center justify-center">
             <span className="text-[10px] font-bold text-white leading-none">D</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900 tracking-tight">DocuSend</span>
        </div>
        <div className="text-sm text-neutral-500 font-medium">
          © {new Date().getFullYear()} DocuSend. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
