import { useState } from 'react'
import { ArrowUpRight, Church, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { AccountType, UserRole } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

type LoginResult = {
  role: UserRole
  accountType: AccountType
  churchId: string | null
}

export function Login({ onLogin }: { onLogin: (session: LoginResult) => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const key = username.trim().toLowerCase()
    if (!key || !password) {
      setError('Enter your username and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: key, password }),
      })
      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        setError(
          response.status >= 500
            ? problem?.error || 'The authentication service is unavailable. Try again shortly.'
            : 'The username or password is incorrect.'
        )
        return
      }
      const result = (await response.json()) as LoginResult
      onLogin(result)
    } catch {
      setError('Secure sign-in is unavailable. Try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="login-art">
        <img
          className="district-3d-visual"
          src="/assets/district-network-3d.png"
          alt="District church network visualization"
        />
        <div className="art-copy">
          <span className="eyebrow">Kanyakumari District</span>
          <h1>
            One district.
            <br />
            <em>Every detail.</em>
          </h1>
          <p>An enterprise-grade workspace connecting every section and local church.</p>
          <div className="art-stat">
            <ShieldCheck size={18} />
            <span>Role-based access &amp; governance</span>
          </div>
        </div>
      </div>

      <div className="login-panel">
        <div className="brand">
          <div className="brand-mark">
            <Church size={18} strokeWidth={2.2} />
          </div>
          <span>District<span className="text-district-600 dark:text-district-400 font-bold">OS</span></span>
        </div>

        <div className="login-form">
          <div className="space-y-1 mb-6">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Authentication Portal
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Welcome back
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in with your assigned administrative credentials.
            </p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="e.g. admin or section1"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)]">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••••"
                required
              />
            </div>

            {error && (
              <div
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-medium"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold shadow-md mt-2"
              disabled={loading}
            >
              <span>{loading ? 'Authenticating…' : 'Enter Workspace'}</span>
              {!loading && <ArrowUpRight size={17} />}
            </Button>
          </form>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
              <LockKeyhole size={14} className="shrink-0 text-slate-500 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Demo Accounts:</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  District: <code className="font-mono font-medium text-slate-800 dark:text-slate-200">admin</code> · Sections: <code className="font-mono font-medium text-slate-800 dark:text-slate-200">section1–4</code> · Sunday School: <code className="font-mono font-medium text-slate-800 dark:text-slate-200">headmaster / teacher</code>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
