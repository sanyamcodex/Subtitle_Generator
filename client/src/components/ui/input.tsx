import * as React from 'react';
import { cn } from '../../lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-white/20 bg-black/40 px-4 py-2 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/15',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
