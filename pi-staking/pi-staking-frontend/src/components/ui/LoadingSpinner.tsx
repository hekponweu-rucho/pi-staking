import * as React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ label, className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses =
    size === 'sm' ? 'h-5 w-5 border-2' : size === 'lg' ? 'h-10 w-10 border-4' : 'h-8 w-8 border-4';

  return (
    <div className={cn('flex items-center justify-center gap-3', className)} role="status" aria-live="polite">
      <div className={cn('animate-spin rounded-full pi-gradient border-t-transparent', sizeClasses)} />
      {label ? (
        <span className="text-sm text-muted-foreground whitespace-nowrap text-ellipsis overflow-hidden max-w-[70vw]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
