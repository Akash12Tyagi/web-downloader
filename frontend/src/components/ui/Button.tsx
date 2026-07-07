'use client';

import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface text-text-primary border border-border-strong hover:border-accent hover:bg-accent-soft',
  ghost: 'bg-transparent text-text-secondary hover:bg-border-subtle hover:text-text-primary',
  outline: 'bg-transparent border border-border-strong text-text-primary hover:border-accent',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, className, children, onClick, disabled, ...props },
    ref,
  ) => {
    function handleClick(e: MouseEvent<HTMLButtonElement>) {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple-el';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
      onClick?.(e);
    }

    return (
      <button
        ref={ref}
        className={clsx(
          'relative inline-flex items-center justify-center overflow-hidden font-medium',
          'transition-all duration-200 ease-out select-none whitespace-nowrap',
          'focus-ring disabled:opacity-50 disabled:pointer-events-none',
          'active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
