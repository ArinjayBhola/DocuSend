import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-semibold text-neutral-700 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all duration-200
            placeholder:text-neutral-400 outline-none
            ${error 
              ? 'border-red-500 focus:ring-4 focus:ring-red-100' 
              : 'border-neutral-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'}
            ${className}
          `}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p className={`text-xs ml-1 ${error ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
