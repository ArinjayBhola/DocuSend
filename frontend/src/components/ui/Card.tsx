import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  hoverable = false
}: CardProps) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`
      bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden
      ${paddings[padding]}
      ${hoverable ? 'hover:shadow-md hover:border-neutral-300 transition-all duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
