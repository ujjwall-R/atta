import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const base = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm placeholder:text-[#a3aca5] outline-none transition focus:border-[#7eaa8a] focus:ring-4 focus:ring-[#e2eee3]'
export function Field({ label, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className="block space-y-1.5"><span className="block text-[12px] font-semibold text-[#526057]">{label}</span><input className={cn(base, className)} {...props} />{hint && <span className="block text-[11px] text-muted">{hint}</span>}</label>
}
export function TextArea({ label, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="block space-y-1.5"><span className="block text-[12px] font-semibold text-[#526057]">{label}</span><textarea className={cn(base, 'min-h-20 resize-y', className)} {...props} /></label>
}
