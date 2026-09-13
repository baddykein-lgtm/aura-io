import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-surface border border-white/10 rounded-2xl ${className}`}>{children}</div>
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const base = 'px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = variant === 'primary'
    ? 'text-white bg-gradient-to-br from-accent to-accent-2 hover:opacity-90'
    : 'text-muted hover:bg-white/5 hover:text-text'
  return <button className={`${base} ${styles} ${className}`} {...props} />
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`bg-bg border border-white/15 text-text placeholder:text-faint px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-accent transition-colors ${className}`}
      {...props}
    />
  )
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`bg-bg border border-white/15 text-text placeholder:text-faint px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-accent transition-colors ${className}`}
      {...props}
    />
  )
}
