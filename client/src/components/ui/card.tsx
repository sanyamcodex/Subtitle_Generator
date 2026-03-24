import * as React from 'react';
import { cn } from '../../lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
};

export function Card({ className, title, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm transition-all duration-200 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {title && <h3 className='mb-3 text-lg font-semibold text-white'>{title}</h3>}
      {children}
    </div>
  );
}
