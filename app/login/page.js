"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, signInWithEmailAndPassword, onAuthStateChanged, doc, getDoc } from "@/lib/firebase";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                router.replace("/");
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsub();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
            const userDocRef = doc(db, "users", user.uid);
            const snap = await getDoc(userDocRef);

            if (!snap.exists()) {
                throw new Error("Perfil de usuario no encontrado");
            }

            router.replace("/");
        } catch (err) {
            console.error("Login error:", err);
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("Correo electrónico o contraseña incorrectos");
            } else if (err.code === "auth/too-many-requests") {
                setError("Demasiados intentos fallidos. Intenta más tarde");
            } else if (err.code === "auth/invalid-credential") {
                setError("Credenciales inválidas");
            } else {
                setError(err.message || "Error al iniciar sesión");
            }
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="loading-fullpage">
                <div className="spinner" />
                <style jsx>{`
          .loading-fullpage {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(145deg, #F0F4FA 0%, #E8EDF5 100%);
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(3, 74, 166, 0.15);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="bg-layer" />
            <div className="bg-layer-secondary" />

            <div className="login-shell">
                <div className="login-card">
                    <div className="brand-header">
                        <div className="brand-mark">
                            <Image src="/img/logo.png" alt="Legaly" width={44} height={44} priority />
                        </div>
                        <div className="brand-copy">
                            <span className="brand-name">Legaly</span>
                            <span className="brand-sub">Sistema de gestión documental</span>
                        </div>
                    </div>

                    <div className="title-wrap">
                        <h1>Acceso al sistema</h1>
                        <p>Ingresa con tu correo y contraseña registrados.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="field">
                            <label htmlFor="email">Correo electrónico</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@empresa.com"
                                required
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="password">Contraseña</label>
                            <div className="password-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingresa tu contraseña"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-msg">
                                <i className="fas fa-circle-exclamation" />
                                {error}
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? <div className="btn-spinner" /> : "Ingresar"}
                        </button>

                        <p className="terms">
                            Al continuar aceptas los{" "}
                            <a href="/terminos" target="_blank" rel="noopener">
                                términos y condiciones
                            </a>.
                        </p>
                    </form>
                </div>
            </div>

            <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, #eef3fb 0%, #e7edf7 100%);
          padding: 20px;
        }

        .bg-layer {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(circle at 20% 15%, rgba(3, 74, 166, 0.12), transparent 30%),
            radial-gradient(circle at 85% 85%, rgba(3, 74, 166, 0.09), transparent 30%);
          pointer-events: none;
        }

        .bg-layer-secondary {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(15, 41, 86, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 41, 86, 0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(circle at center, black 55%, transparent 100%);
          pointer-events: none;
          opacity: 0.45;
        }

        .login-shell {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 430px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 18px;
          padding: 30px;
          box-shadow:
            0 2px 8px rgba(3, 74, 166, 0.06),
            0 18px 42px rgba(3, 74, 166, 0.12);
          backdrop-filter: blur(8px);
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .brand-mark {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(3, 74, 166, 0.08);
          display: grid;
          place-items: center;
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .brand-name {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--foreground);
        }

        .brand-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .title-wrap {
          margin-bottom: 18px;
        }

        h1 {
          margin: 0 0 4px;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--foreground);
        }

        .title-wrap p {
          margin: 0;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        input {
          width: 100%;
          padding: 12px 13px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          color: var(--foreground);
          background: #f8fafc;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          outline: none;
        }

        input::placeholder {
          color: var(--text-muted);
        }

        input:hover {
          border-color: var(--border-hover);
          background: white;
        }

        input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(3, 74, 166, 0.12);
          background: white;
        }

        .password-wrapper {
          position: relative;
        }

        .password-wrapper input {
          padding-right: 42px;
        }

        .toggle-password {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .toggle-password:hover {
          color: var(--text-secondary);
          background: rgba(3, 74, 166, 0.06);
        }

        .error-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: var(--error);
          font-size: 13px;
          font-weight: 600;
        }

        .submit-btn {
          width: 100%;
          min-height: 46px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(130deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease, box-shadow 0.2s ease;
          box-shadow: 0 10px 22px rgba(3, 74, 166, 0.28);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(3, 74, 166, 0.3);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .terms {
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
          margin: 2px 0 0;
          line-height: 1.45;
        }

        .terms a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }

        .terms a:hover {
          text-decoration: underline;
        }

        @media (max-width: 520px) {
          .login-card {
            padding: 22px 18px;
            border-radius: 15px;
          }

          h1 {
            font-size: 21px;
          }
        }
      `}</style>
        </div>
    );
}
