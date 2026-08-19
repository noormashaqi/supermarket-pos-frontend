import type { ReactNode } from 'react';

export interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
  showDot?: boolean;
}

export const Badge = ({ variant, children, showDot = true }: BadgeProps) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
  };

  const dotStyles = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-indigo-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide border shadow-2xs ${styles[variant]}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};
