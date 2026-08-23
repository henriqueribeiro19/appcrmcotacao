import { type HTMLAttributes, type ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div {...props} className={`bg-slate-850 border border-slate-800 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}
