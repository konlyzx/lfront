"use client";

import { useState } from "react";
import Image from "next/image";

const API_BASE = "https://api.legaly.space";

export default function VerificacionPage() {
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [documents, setDocuments] = useState([]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError("");
        if (!/^\+?\d{10,}$/.test(phone.trim())) {
            setError("Ingresa un número válido con código de país");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phone.trim().replace("+", "") }),
            });
            if (!res.ok) throw new Error("Error al enviar OTP");
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[0];
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        // Auto focus next
        if (value && index < 5) {
            const next = document.getElementById(`otp-${index + 1}`);
            if (next) next.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prev = document.getElementById(`otp-${index - 1}`);
            if (prev) prev.focus();
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError("");
        const code = otp.join("");
        if (code.length < 6) {
            setError("Ingresa el código completo");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phone.trim().replace("+", ""), code }),
            });
            if (!res.ok) throw new Error("Código incorrecto o expirado");
            const data = await res.json();
            setDocuments(data.documents || []);
            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verificacion-page">
            <div className="bg-gradient" />
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />

            <div className="container">
                <div className="card">
                    <div className="card-header">
                        <Image src="/img/logo.png" alt="Legaly" width={120} height={36} priority />
                        <h1>Verificación de Documentos</h1>
                        <p className="subtitle">Verifica tus documentos firmados de manera segura</p>
                    </div>

                    {/* Steps indicator */}
                    <div className="steps">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`step-dot ${step >= s ? "active" : ""} ${step === s ? "current" : ""}`}>
                                {step > s ? <i className="fas fa-check" /> : s}
                            </div>
                        ))}
                        <div className="step-line">
                            <div className="step-line-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
                        </div>
                    </div>

                    {/* Step 1: Phone */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="step-content">
                            <h2>Ingresa tu número</h2>
                            <p>Te enviaremos un código de verificación por WhatsApp.</p>
                            <div className="field">
                                <label htmlFor="phone">Número de WhatsApp</label>
                                <input
                                    id="phone"
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+57 316 1234567"
                                    autoFocus
                                />
                            </div>
                            {error && <div className="error"><i className="fas fa-circle-exclamation" /> {error}</div>}
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? <div className="btn-spinner" /> : <>Enviar Código <i className="fas fa-arrow-right" /></>}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="step-content">
                            <h2>Código de verificación</h2>
                            <p>Ingresa el código de 6 dígitos enviado a <strong>{phone}</strong></p>
                            <div className="otp-row">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                        className="otp-input"
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>
                            {error && <div className="error"><i className="fas fa-circle-exclamation" /> {error}</div>}
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? <div className="btn-spinner" /> : "Verificar"}
                            </button>
                            <button type="button" className="btn-link" onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); }}>
                                <i className="fas fa-arrow-left" /> Cambiar número
                            </button>
                        </form>
                    )}

                    {/* Step 3: Documents */}
                    {step === 3 && (
                        <div className="step-content">
                            <div className="success-icon"><i className="fas fa-circle-check" /></div>
                            <h2>Verificación Exitosa</h2>
                            {documents.length === 0 ? (
                                <p className="no-docs">No se encontraron documentos firmados para este número.</p>
                            ) : (
                                <div className="doc-list">
                                    {documents.map((doc, i) => (
                                        <div key={i} className="doc-item">
                                            <i className="fas fa-file-pdf" />
                                            <div className="doc-info">
                                                <span className="doc-name">{doc.name || `Documento ${i + 1}`}</span>
                                                <span className="doc-date">{doc.date || "Fecha desconocida"}</span>
                                            </div>
                                            {doc.url && (
                                                <a href={doc.url} target="_blank" rel="noopener" className="doc-link">
                                                    <i className="fas fa-download" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="btn-primary" onClick={() => { setStep(1); setPhone(""); setOtp(["", "", "", "", "", ""]); setDocuments([]); setError(""); }}>
                                <i className="fas fa-rotate-left" /> Nueva Verificación
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .verificacion-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(155deg, #F0F4FA 0%, #E4EAF4 40%, #DBE3F0 100%);
          position: relative;
          overflow: hidden;
        }
        .bg-gradient {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(3,74,166,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .bg-orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; opacity: 0.5; }
        .bg-orb-1 { width: 500px; height: 500px; background: rgba(3,74,166,0.07); top: -200px; right: -80px; }
        .bg-orb-2 { width: 350px; height: 350px; background: rgba(52,211,153,0.06); bottom: -100px; left: -50px; }

        .container { position: relative; z-index: 1; width: 100%; max-width: 480px; padding: 20px; }

        .card {
          background: white;
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(3,74,166,0.08);
          animation: cardIn 0.4s ease-out;
        }
        @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } }

        .card-header { text-align: center; margin-bottom: 24px; }
        .card-header h1 { font-size: 20px; font-weight: 700; color: var(--primary); margin-top: 16px; }
        .subtitle { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

        .steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 28px;
          position: relative;
          padding: 0 40px;
        }
        .step-dot {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--bg-muted);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
          flex-shrink: 0;
          margin: 0 28px;
        }
        .step-dot.active {
          background: var(--primary);
          color: white;
        }
        .step-dot.current {
          box-shadow: 0 0 0 4px rgba(3,74,166,0.15);
        }
        .step-line {
          position: absolute;
          top: 50%;
          left: 72px;
          right: 72px;
          height: 2px;
          background: var(--border);
          transform: translateY(-50%);
          z-index: 1;
        }
        .step-line-fill {
          height: 100%;
          background: var(--primary);
          transition: width 0.4s ease;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }
        .step-content h2 { font-size: 18px; font-weight: 700; color: var(--foreground); }
        .step-content > p { font-size: 14px; color: var(--text-secondary); }

        .field { text-align: left; display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
        input {
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 15px;
          font-family: inherit;
          color: var(--foreground);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(3,74,166,0.1);
        }

        .otp-row {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        .otp-input {
          width: 48px !important;
          height: 54px;
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          padding: 0;
          border-radius: 10px;
        }

        .error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          color: var(--error);
          font-size: 14px;
          font-weight: 500;
        }

        .btn-primary {
          padding: 12px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 46px;
        }
        .btn-primary:hover:not(:disabled) { background: var(--primary-light); box-shadow: 0 4px 12px rgba(3,74,166,0.2); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-link {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: inherit;
          transition: color 0.15s;
        }
        .btn-link:hover { color: var(--primary); }

        .btn-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .success-icon { font-size: 48px; color: var(--success); }

        .no-docs { font-size: 14px; color: var(--text-muted); padding: 16px 0; }

        .doc-list { display: flex; flex-direction: column; gap: 8px; text-align: left; }
        .doc-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 10px;
          transition: all 0.15s;
        }
        .doc-item:hover { border-color: var(--border-hover); }
        .doc-item > i { font-size: 20px; color: var(--error); }
        .doc-info { flex: 1; display: flex; flex-direction: column; }
        .doc-name { font-size: 14px; font-weight: 600; color: var(--foreground); }
        .doc-date { font-size: 12px; color: var(--text-muted); }
        .doc-link {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background 0.15s;
        }
        .doc-link:hover { background: var(--primary-light); }

        @media (max-width: 480px) {
          .card { padding: 28px 20px; }
          .otp-input { width: 40px !important; height: 48px; font-size: 18px; }
        }
      `}</style>
        </div>
    );
}
