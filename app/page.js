"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { sendFirmaWithUpload, checkBackendHealth } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";

export default function HomePage() {
  const [phone, setPhone] = useState("");
  const [param1, setParam1] = useState("");
  const [param2, setParam2] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    checkBackendHealth().then(setConnected);
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") setFile(f);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    const phoneClean = phone.trim();
    if (!/^\+?\d{10,}$/.test(phoneClean)) {
      setStatus({ type: "error", message: "Ingresa un número de WhatsApp válido (con código de país)." });
      return;
    }
    if (!param1.trim()) {
      setStatus({ type: "error", message: "Ingresa el nombre del destinatario." });
      return;
    }
    if (!param2.trim()) {
      setStatus({ type: "error", message: "Ingresa el nombre del remitente." });
      return;
    }
    if (!file) {
      setStatus({ type: "error", message: "Selecciona el archivo PDF para la firma." });
      return;
    }
    setSending(true);
    setStatus({ type: "loading", message: "Enviando invitación de firma..." });
    try {
      const token = localStorage.getItem("token");
      await sendFirmaWithUpload({ to: phoneClean, param1: param1.trim(), param2: param2.trim(), pdfFile: file, authToken: token });
      setSuccess({ name: param1.trim(), phone: phoneClean });
      setPhone(""); setParam1(""); setParam2(""); setFile(null);
      setStatus({ type: "", message: "" });
    } catch (err) {
      setStatus({ type: "error", message: `Error: ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell title="Envío de Firma">
      <div className={styles.pageWrapper}>
        <AnimatePresence mode="wait">
          {connected === false && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={styles.alertError}>
              <i className="fas fa-circle-xmark" /> No se pudo conectar al servidor.
            </motion.div>
          )}

          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.5 }}
              className={`${styles.successCard} ${styles.successPanel}`}
            >
              <div className={styles.successHeader}>
                <span className={styles.successBadge}><i className="fas fa-check-circle" /> Envío completado</span>
                <div className={styles.successIcon}><i className="fas fa-file-signature" /></div>
                <h2 className={styles.successTitle}>¡Documento enviado y en cola de firma!</h2>
                <p className={styles.successSubtitle}>Se notificó al destinatario por WhatsApp y se generó la trazabilidad de auditoría.</p>
              </div>

              <div className={styles.successGrid}>
                <div className={styles.dataCard}>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Destinatario</span>
                    <span className={styles.dataValue}>{success.name}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>WhatsApp</span>
                    <span className={styles.dataValue}>{success.phone}</span>
                  </div>
                  <div className={styles.dataTag}>
                    <i className="fas fa-shield-check" /> Canal cifrado
                  </div>
                </div>

                <div className={styles.timeline}>
                  <div className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div>
                      <p className={styles.timelineTitle}>Enviado</p>
                      <p className={styles.timelineText}>Invitación distribuida por WhatsApp</p>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <span className={`${styles.timelineDot} ${styles.timelineDotPending}`} />
                    <div>
                      <p className={styles.timelineTitle}>Pendiente de firma</p>
                      <p className={styles.timelineText}>Esperando la firma del destinatario</p>
                    </div>
                  </div>
                  <div className={styles.timelineItemMuted}>
                    <span className={styles.timelineDotMuted} />
                    <div>
                      <p className={styles.timelineTitle}>Certificación</p>
                      <p className={styles.timelineText}>Se habilitará al finalizar la firma</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.successActions}>
                <button className={styles.newBtn} onClick={() => setSuccess(null)}>
                  <i className="fas fa-plus" /> Nuevo envío
                </button>
                <Link className={styles.ghostBtn} href="/historial">
                  <i className="fas fa-clock-rotate-left" /> Ver historial
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <div className={styles.hero}>
                <div className={styles.heroIcon}><i className="fas fa-file-signature" /></div>
                <div className={styles.heroContent}>
                  <h1 className={styles.heroTitle}>Enviar Documento para Firma</h1>
                  <p className={styles.heroSubtitle}>Completa los datos del destinatario y sube el PDF para enviar la invitación por WhatsApp</p>
                </div>
              </div>

              <div className={styles.formCard}>
                <form className={styles.form} onSubmit={handleSubmit}>
                  {/* Step 1: Destinatario */}
                  <div className={styles.stepSection}>
                    <div className={styles.stepLabel}>
                      <span className={styles.stepNumber}>1</span> Datos del Destinatario
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        <i className="fas fa-phone" /> Número de WhatsApp
                      </label>
                      <input
                        className={styles.fieldInput}
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: 573161234567 (incluye código país)"
                      />
                      <span className={styles.fieldHint}>Incluye código de país: +52 México, +57 Colombia, +1 EEUU</span>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        <i className="fas fa-user" /> Nombre Completo
                      </label>
                      <input
                        className={styles.fieldInput}
                        type="text"
                        value={param1}
                        onChange={(e) => setParam1(e.target.value)}
                        placeholder="Nombre completo de quien firma"
                      />
                    </div>
                  </div>

                  <div className={styles.stepDivider} />

                  {/* Step 2: Remitente */}
                  <div className={styles.stepSection}>
                    <div className={styles.stepLabel}>
                      <span className={styles.stepNumber}>2</span> Datos del Remitente
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        <i className="fas fa-user-pen" /> Tu Nombre o Empresa
                      </label>
                      <input
                        className={styles.fieldInput}
                        type="text"
                        value={param2}
                        onChange={(e) => setParam2(e.target.value)}
                        placeholder="Tu nombre o el de tu empresa"
                      />
                    </div>
                  </div>

                  <div className={styles.stepDivider} />

                  {/* Step 3: Documento */}
                  <div className={styles.stepSection}>
                    <div className={styles.stepLabel}>
                      <span className={styles.stepNumber}>3</span> Documento PDF
                    </div>

                    <div
                      className={`${styles.dropzone} ${dragOver ? styles.dropzoneDragOver : ""} ${file ? styles.dropzoneHasFile : ""}`}
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: "none" }} />
                      {file ? (
                        <>
                          <i className={`fas fa-file-pdf ${styles.dropzoneIcon} ${styles.dropzoneIconHas}`} />
                          <span className={styles.fileName}>{file.name}</span>
                          <span className={styles.fileChange}>Clic para cambiar archivo</span>
                        </>
                      ) : (
                        <>
                          <i className={`fas fa-cloud-arrow-up ${styles.dropzoneIcon}`} />
                          <span className={styles.dropzoneText}>Arrastra y suelta tu documento o haz clic para seleccionar</span>
                          <span className={styles.dropzoneHint}>Solo archivos PDF — máximo 10MB</span>
                        </>
                      )}
                    </div>
                  </div>

                  {status.message && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={status.type === "error" ? styles.alertError : styles.alertLoading}
                    >
                      {status.type === "loading" && <div className={styles.alertSpinner} />}
                      {status.type === "error" && <i className="fas fa-circle-exclamation" />}
                      {status.message}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={sending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {sending ? <div className={styles.btnSpinner} /> : <><i className="fas fa-paper-plane" /> Enviar Invitación de Firma</>}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
