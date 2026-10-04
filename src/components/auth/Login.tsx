import { useState } from "react";
import { ArrowUpRight, Church, LockKeyhole, ShieldCheck } from "lucide-react";
import type { UserRole } from "../../types";
export function Login({ onLogin }: { onLogin: (role: UserRole) => void }) {
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
        setError(response.status >= 500 ? "The server authentication configuration is unavailable. Check the Vercel environment variables and redeploy." : "The username or password is incorrect.");
        return;
      }
      const result = await response.json() as { role: UserRole };
      onLogin(result.role);
    } catch {
      setError("Secure sign-in is unavailable. Try again shortly.");
    }
  }
  return (
    <main className="login-shell">
      <div className="login-art">
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
