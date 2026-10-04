import { useState } from "react";
import { ArrowUpRight, Church, LockKeyhole, ShieldCheck } from "lucide-react";
import type { AccountType, UserRole } from "../../types";
type LoginResult = { role: UserRole; accountType: AccountType; churchId: string | null };
export function Login({ onLogin }: { onLogin: (session: LoginResult) => void }) {
  const [username, setUsername] = useState("admin"),
    [password, setPassword] = useState("admin"),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const key = username.trim().toLowerCase();
    if (!key || !password) { setError("Enter your username and password."); return; }
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: key, password }),
      });
      if (!response.ok) {
        const problem = await response.json().catch(() => null) as { error?: string } | null;
        setError(response.status >= 500 ? (problem?.error || "The authentication service is unavailable. Try again shortly.") : "The username or password is incorrect.");
        return;
      }
      const result = await response.json() as LoginResult;
      onLogin(result);
    } catch {
      setError("Secure sign-in is unavailable. Try again shortly.");
    }
  }
  return (
    <main className="login-shell">
      <div className="login-art">
        <img className="district-3d-visual" src="/assets/district-network-3d.png" alt="Four churches connected to the district administration" />
        <div className="art-copy">
          <span className="eyebrow">Kanyakumari District</span>
          <h1>
            One district.
            <br />
            <em>Every detail.</em>
          </h1>
          <p>A secure workspace for every district section.</p>
          <div className="art-stat">
            <ShieldCheck size={18} />
            Role-based access
          </div>
        </div>
      </div>
      <div className="login-panel">
        <div className="brand">
          <div className="brand-mark">
            <Church size={19} />
          </div>
          District<span className="brand-accent">OS</span>
        </div>
        <div className="login-form">
          <span className="eyebrow">Admin portal</span>
          <h2>Welcome back.</h2>
          <p className="muted">Sign in to your assigned workspace.</p>
          <form onSubmit={submit} noValidate>
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary full">
              Enter workspace <ArrowUpRight size={17} />
            </button>
          </form>
          <div className="demo-note">
            <LockKeyhole size={15} />
            District: admin · Sections: section1–section4
          </div>
        </div>
      </div>
    </main>
  );
}
