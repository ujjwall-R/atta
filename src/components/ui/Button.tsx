import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const buttonStyles = cva('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 disabled:pointer-events-none disabled:opacity-45', {
  variants: {
    variant: {
      primary: 'bg-forest text-white shadow-sm hover:bg-[#214c37]',
      secondary: 'border border-line bg-white text-ink hover:bg-[#f5f7f4]',
      ghost: 'text-muted hover:bg-[#f0f3ef] hover:text-ink',
      quiet: 'text-forest hover:bg-[#edf4ec]',
      danger: 'text-[#b7473f] hover:bg-[#fff0ee]',
    },
    size: { sm: 'h-9 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-[15px]', icon: 'h-9 w-9' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...props} />
))
Button.displayName = 'Button'
