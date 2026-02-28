import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
  maxWidth?: string
}

export default function PageContainer({ 
  children, 
  title, 
  description, 
  actions, 
  maxWidth = 'max-w-7xl' 
}: PageContainerProps) {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 transition-colors duration-500">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        {(title || actions) && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl tracking-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        )}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </div>
    </div>
  )
}
