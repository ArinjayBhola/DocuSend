export default function Button({ children, variant = 'primary', className = '', ...props }: any) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm'
  const variants: any = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-600 shadow-brand-600/20 hover:shadow-md hover:-translate-y-0.5',
    secondary: 'bg-white text-neutral-800 border border-neutral-200 hover:bg-brand-50 hover:text-brand-900 hover:border-brand-200 focus:ring-neutral-200 hover:shadow-md hover:-translate-y-0.5',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-red-600/10 hover:shadow-md hover:-translate-y-0.5',
    ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 shadow-none hover:shadow-none hover:translate-y-0',
  }
  return (
    <button className={`${base} px-5 py-2.5 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
