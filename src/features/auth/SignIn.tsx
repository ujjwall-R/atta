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

export function AboutAttaCard() {
  return <section className="rounded-xl border border-[#e5ebe2] bg-[#f7faf5] p-3.5">
    <img src="/atta-leafcutter-ant.jpg" alt="Leafcutter ant carrying a green leaf above its head" width="1200" height="800" loading="lazy" className="mb-3 h-36 w-full rounded-lg object-cover object-center" />
    <p className="text-sm font-semibold text-ink">Inspired by leafcutter ants</p>
    <p className="mt-1.5 text-xs leading-5 text-[#68796a]">Atta is a genus of leafcutter ants. Workers cut and carry leaves to grow a fungus garden that feeds the colony. Atta borrows that idea: coordinated, steady effort helps important work get done.</p>
    <a href="https://urbanentomology.tamu.edu/urban-pests/ants/leaf_cutting/" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-forest hover:underline">Learn about leafcutter ants</a>
  </section>
}

export function SignIn() {
  const { signInWithPassword, signUpWithPassword } = useAuth()
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
      <div className="mt-7 mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#a0a9a1]"><span className="h-px flex-1 bg-[#e6eae5]" /> email and password <span className="h-px flex-1 bg-[#e6eae5]" /></div>
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
