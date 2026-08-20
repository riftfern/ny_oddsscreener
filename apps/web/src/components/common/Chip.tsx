import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export default function Chip({ active = false, className = '', children, ...props }: ChipProps) {
  return (
    <button type="button" className={`chip ${active ? 'chip-on' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
