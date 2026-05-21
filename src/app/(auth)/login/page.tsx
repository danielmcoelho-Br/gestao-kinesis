"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { login } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
      // For this demo/local env, we'll save in localStorage
      localStorage.setItem("user", JSON.stringify(result.user));
      router.push("/");
    }

  }

  return (
    <div className="login-container">
      <div className="background-gradient" />
      
      <main className="login-card">
        <header className="login-header">
          <div className="logo-container">
            <div className="logo-image-wrapper logo-blend-multiply">
              <Image 
                  src="/logo-kinesis.png" 
                  alt="KinesisLab Logo" 
                  fill
                  priority
                  sizes="(max-width: 768px) 240px, 288px"
                  style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
          <h1>Kinesis<span>Lab</span></h1>
          <p>Gerenciamento de Avaliações Fisioterapêuticas</p>
        </header>

        <style jsx>{`
          .logo-image-wrapper {
            position: relative;
            width: 288px;
            height: 240px;
            margin: 0 auto 1.5rem;
          }
          @media (max-width: 768px) {
            .logo-image-wrapper {
              width: 240px;
              height: 200px;
              margin-bottom: 1rem;
            }
          }
        `}</style>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar na Plataforma"}
          </button>
        </form>

        <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} KinesisLab. Acesso Restrito.
        </footer>
      </main>
    </div>
  );
}
