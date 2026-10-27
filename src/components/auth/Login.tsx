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
            District Administration
          </h1>
          <p>Ecclesiastical governance and parish administration.</p>
          <div className="art-stat">
            <ShieldCheck size={18} />
            <span>Role-based access</span>
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Sign In
            </h2>
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
                placeholder="Username"
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
                placeholder="Password"
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
              className="w-full h-10 text-sm font-semibold shadow-xs mt-2"
              disabled={loading}
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              {!loading && <ArrowUpRight size={17} />}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
