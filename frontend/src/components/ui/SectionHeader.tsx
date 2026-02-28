import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  description,
  actions,
  className = ''
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 ${className}`}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{title}</h1>
        {description && (
          <p className="text-base text-neutral-500 font-medium">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
