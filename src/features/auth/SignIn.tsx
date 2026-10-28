import { useState, type FormEvent } from 'react'
import { ArrowRight, Leaf, LockKeyhole, UserRoundPlus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { useAuth } from './AuthProvider'

function AntMark({ small = false }: { small?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 40 40" className={small ? 'h-8 w-8' : 'h-11 w-11'} fill="none">
    <circle cx="20" cy="10" r="3.6" fill="#345E42" /><circle cx="20" cy="20" r="4.2" fill="#345E42" /><ellipse cx="20" cy="30" rx="5.2" ry="6" fill="#345E42" />
    <path d="M17.8 7.5 14 3.5M22.2 7.5 26 3.5M15.8 18 10 14M24.2 18 30 14M16.2 22 10 26M23.8 22 30 26M17 27 13 33M23 27 27 33" stroke="#345E42" strokeWidth="2" strokeLinecap="round" />
  </svg>
}

export { AntMark }

export function SignIn() {
  const { signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('')
    if (mode === 'signup' && password !== confirmPassword) { setError('Those passwords do not match.'); return }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const needsConfirmation = await signUpWithPassword(email, password)
        if (needsConfirmation) setMessage('Account request received. If email confirmation is enabled, confirm your address before signing in. Supabase email limits may apply.')
      } else {
        await signInWithPassword(email, password)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : mode === 'signup' ? 'Unable to create your account.' : 'Unable to sign in.')
    } finally { setBusy(false) }
  }
  const switchMode = () => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage('') }
  return <main className="grid min-h-screen bg-[#f7f8f6] lg:grid-cols-[1fr_.9fr]">
    <section className="relative hidden overflow-hidden bg-[#eaf0e6] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
      <div className="relative z-10 flex items-center gap-3"><AntMark /><span className="font-display text-[23px] font-extrabold tracking-[-.06em] text-ink">atta<span className="text-[#8fa34c]">.</span></span></div>
      <div className="relative z-10 max-w-xl pb-7"><span className="inline-flex items-center gap-2 rounded-full border border-[#d7e1d1] bg-white/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.13em] text-[#66775f]"><Leaf size={13} /> Made for steady progress</span><h1 className="mt-6 font-display text-5xl font-bold leading-[1.08] tracking-[-.055em] text-[#203a2b] xl:text-[58px]">Make room for<br /><span className="text-[#62824d]">what matters.</span></h1><p className="mt-5 max-w-md text-base leading-7 text-[#647465]">A little clarity goes a long way. See what needs your attention today, and what can wait.</p></div>
      <div className="relative z-10 flex items-center gap-2 text-xs text-[#71806f]"><span className="h-2 w-2 rounded-full bg-[#8fa34c]" /> Your priorities, in rhythm with time.</div>
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-[460px] w-[460px] rounded-full border border-[#d3dfce]" /><div className="pointer-events-none absolute -bottom-16 -right-4 h-[340px] w-[340px] rounded-full border border-[#d3dfce]" /><div className="pointer-events-none absolute bottom-12 right-12 h-[180px] w-[180px] rounded-full bg-[#dce8d4]/60" />
    </section>
    <section className="grid place-items-center p-6 sm:p-10"><div className="w-full max-w-[390px]">
      <div className="mb-10 flex items-center gap-2.5 lg:hidden"><AntMark small /><span className="font-display text-2xl font-extrabold tracking-[-.06em] text-ink">atta<span className="text-[#8fa34c]">.</span></span></div>
      <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#879489]">A calmer way to plan</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-.04em] text-ink">{mode === 'signin' ? 'Welcome to Atta' : 'Create your account'}</h2><p className="mt-2 text-sm leading-6 text-muted">{mode === 'signin' ? 'Sign in with your email and password.' : 'Use your email address and choose a password.'}</p>
      <Button variant="secondary" size="lg" className="mt-7 w-full" onClick={() => { setError(''); void signInWithGoogle().catch((e: unknown) => setError(e instanceof Error ? e.message : 'Google sign in failed.')) }}><svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.75 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.85 0-5.27-1.92-6.13-4.5H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.87 14.14A6.6 6.6 0 0 1 5.53 12c0-.74.13-1.46.34-2.14V7.02H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.98l3.69-2.84Z"/><path fill="#EA4335" d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.03 14.97 1 12 1a11 11 0 0 0-9.82 6.02l3.69 2.84c.86-2.58 3.28-4.5 6.13-4.5Z"/></svg>Continue with Google</Button>
      <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#a0a9a1]"><span className="h-px flex-1 bg-[#e6eae5]" /> or use email and password <span className="h-px flex-1 bg-[#e6eae5]" /></div>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email address" type="email" required placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} hint={mode === 'signup' ? 'At least 6 characters.' : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
        {mode === 'signup' && <Field label="Confirm password" type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />}
        <Button size="lg" className="w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? <><LockKeyhole size={15} /> Sign in <ArrowRight size={15} className="ml-auto" /></> : <><UserRoundPlus size={15} /> Create account <ArrowRight size={15} className="ml-auto" /></>}</Button>
      </form>
      {message && <p role="status" className="mt-3 rounded-xl border border-[#d8e8d6] bg-[#f1f7ef] px-3 py-2 text-xs leading-5 text-[#526b55]">{message}</p>}
      {error && <p role="alert" className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-xs text-[#a83f38]">{error}</p>}
      <p className="mt-4 text-center text-xs text-muted">{mode === 'signin' ? 'New to Atta?' : 'Already have an account?'} <button type="button" onClick={switchMode} className="font-semibold text-forest hover:underline">{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>
      {mode === 'signup' && <p className="mt-3 text-center text-[11px] leading-5 text-[#9aa39b]">Email confirmation may be required depending on your Supabase Auth settings.</p>}
      <p className="mt-5 text-center text-[11px] leading-5 text-[#9aa39b]">By continuing, you agree to keep your attention on what matters.</p>
    </div></section>
  </main>
}
