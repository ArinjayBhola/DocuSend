export default function Input({ label, error, className = '', ...props }: any) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-neutral-800 mb-1.5">{label}</label>}
      <input
        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 shadow-sm"
        {...props}
      />
      {error && <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>}
    </div>
  )
}
