"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { fetchHistorial, fetchHistorialSupabase } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";

const PER_PAGE = 10;

const STATUS_STYLE = {
  "Enviado": { label: "Enviado", color: "#1D4ED8", bg: "#EFF6FF", dot: "#3B82F6" },
  "Esperando Firma": { label: "Esperando Firma", color: "#92400E", bg: "#FFFBEB", dot: "#F59E0B" },
  "Esperando Video": { label: "Esperando Video", color: "#92400E", bg: "#FFFBEB", dot: "#F59E0B" },
  "Firmado con Video": { label: "Firmado", color: "#065F46", bg: "#ECFDF5", dot: "#10B981" },
  "Rechazado": { label: "Rechazado", color: "#991B1B", bg: "#FEF2F2", dot: "#EF4444" },
  "Error": { label: "Error", color: "#991B1B", bg: "#FEF2F2", dot: "#EF4444" },
  "Cancelado": { label: "Cancelado", color: "#475569", bg: "#F1F5F9", dot: "#CBD5E1" },
};

export default function HistorialPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [resendingId, setResendingId] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const token = localStorage.getItem("token");
      const result = await fetchHistorial(token);
      let items = Array.isArray(result) ? result : result.data || [];

      // Fallback a Supabase si la API no devuelve datos
      if ((!items || items.length === 0) && result.warning) {
        const supa = await fetchHistorialSupabase();
        items = Array.isArray(supa) ? supa : supa.data || [];
      }

      setData(items);
    } catch (err) {
      try {
        const supa = await fetchHistorialSupabase();
        const items = Array.isArray(supa) ? supa : supa.data || [];
        setData(items);
        setError("");
      } catch (err2) {
        setError("Error al cargar el historial: " + err2.message);
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── helpers to read nested API fields ── */
  const getField = (item, path) => {
    if (!item) return "";
    // item.firma.recipient_name  →  look inside firma object
    if (item.firma && typeof item.firma === "object") {
      if (path === "recipient") return item.firma.recipient_name || "";
      if (path === "sender") return item.firma.sender_name || "";
      if (path === "status") return item.firma.status || "";
      if (path === "doc_url") return item.firma.document_url || "";
      if (path === "signed_url") return item.firma.modified_pdf_url || "";
    }
    if (path === "phone") return item.cedula || item.phone || item.to || "";
    if (path === "date") return item.fecha || item.created_at || item.date || "";
    return "";
  };

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const st = getField(item, "status");
      if (statusFilter && st !== statusFilter) return false;
      if (dateFilter) {
        const raw = getField(item, "date");
        if (raw) {
          const isoDate = new Date(raw).toISOString().split("T")[0];
          if (isoDate !== dateFilter) return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        const name = getField(item, "recipient").toLowerCase();
        const sender = getField(item, "sender").toLowerCase();
        const phone = getField(item, "phone").toLowerCase();
        if (!name.includes(q) && !sender.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [data, statusFilter, dateFilter, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const clearFilters = () => { setStatusFilter(""); setDateFilter(""); setSearch(""); setPage(1); };

  const fmtDate = (raw) => {
    if (!raw) return "—";
    try {
      return new Date(raw).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return "—"; }
  };

  /* ── smart pagination: current ± 2 with ellipsis ── */
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const resolveId = (item) => item.id || item._id || item.firma?.id || item.firma_id || item.messageId || item.whatsapp_message_id;

  const deriveFilename = (url) => {
    if (!url) return "";
    try {
      const clean = url.split("?")[0];
      const parts = clean.split("/");
      return parts[parts.length - 1] || "";
    } catch {
      return "";
    }
  };

  const handleResend = (item) => {
    const phone = (getField(item, "phone") || "").replace(/[^\d+]/g, "");
    const name = getField(item, "recipient") || "destinatario";
    const displayUrl = getField(item, "signed_url") || getField(item, "doc_url");

    if (!phone) {
      setToast("No hay número de WhatsApp para reenviar.");
      return;
    }
    if (!displayUrl) {
      setToast("No hay URL del documento para reenviar.");
      return;
    }

    const digits = phone.startsWith("+") ? phone.slice(1) : phone;
    const message = `Hola ${name}, te reenvío tu documento para firma: ${displayUrl}\n\nSi ya lo firmaste, ignora este mensaje.`;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

    setResendingId(resolveId(item));
    setToast("");
    window.open(url, "_blank", "noopener");
    setToast("Se abrió WhatsApp Web para reenviar el enlace.");
    setTimeout(() => setResendingId(""), 800);
  };

  return (
    <AppShell title="Historial de Firmas">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerIcon}><i className="fas fa-clock-rotate-left" /></div>
          <div className={styles.headerTextBlock}>
            <h2>Historial de Envíos</h2>
            <p>{filtered.length} registro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Filters — horizontal bar */}
        <div className={styles.filtersBar}>
          <div className={`${styles.filterGroup} ${styles.filterGroupStatus}`}>
            <label className={styles.filterLabel}>Estado</label>
            <select className={styles.filterSelect} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              <option value="Enviado">Enviado</option>
              <option value="Esperando Firma">Esperando Firma</option>
              <option value="Esperando Video">Esperando Video</option>
              <option value="Firmado con Video">Firmado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Error">Error</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div className={`${styles.filterGroup} ${styles.filterGroupDate}`}>
            <label className={styles.filterLabel}>Fecha</label>
            <input className={styles.filterInput} type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} />
          </div>
          <div className={`${styles.filterGroup} ${styles.filterGroupSearch}`}>
            <label className={styles.filterLabel}>Buscar</label>
            <input className={styles.filterInput} type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Nombre, teléfono, remitente..." />
          </div>
          <button className={styles.btnClear} onClick={clearFilters}>
            <i className="fas fa-rotate-left" /> Limpiar
          </button>
        </div>

        {toast && (
          <div className={styles.toastSuccess}>
            <i className="fas fa-check-circle" /> {toast}
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.stateCard}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>Cargando historial...</p>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.stateCard}>
              <div className={styles.stateIcon}><i className="fas fa-triangle-exclamation" /></div>
              <h3 className={styles.stateTitle}>Error de conexión</h3>
              <p className={styles.stateText}>{error}</p>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className={styles.stateCard}>
              <div className={styles.stateIcon}><i className="fas fa-inbox" /></div>
              <h3 className={styles.stateTitle}>Sin resultados</h3>
              <p className={styles.stateText}>No se encontraron envíos que coincidan con los filtros.</p>
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Documento</th>
                        <th className={`${styles.th} ${styles.hideMobile}`}>Destinatario</th>
                        <th className={styles.th}>Fecha envío</th>
                        <th className={styles.th}>Estado</th>
                        <th className={styles.th}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((item, i) => {
                        const statusVal = getField(item, "status");
                        const s = STATUS_STYLE[statusVal] || { label: statusVal || "—", color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" };
                        const docUrl = getField(item, "doc_url");
                        const signedUrl = getField(item, "signed_url");
                        const displayUrl = signedUrl || docUrl;
                        const filename = deriveFilename(displayUrl) || "Documento.pdf";
                        return (
                          <motion.tr
                            key={item.id || i}
                            className={styles.trRow}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                          >
                            <td className={styles.td}>
                              <div className={styles.docCell}>
                                <div className={styles.docIcon}><i className="fas fa-file-pdf" /></div>
                                <div className={styles.docMeta}>
                                  <span className={styles.docName} title={filename}>{filename}</span>
                                  <span className={styles.docSender}>{getField(item, "sender") || "—"}</span>
                                </div>
                              </div>
                            </td>
                            <td className={`${styles.td} ${styles.nameCell} ${styles.hideMobile}`}>
                              <div className={styles.destMeta}>
                                <span className={styles.destName}>{getField(item, "recipient") || "—"}</span>
                                <span className={styles.destPhone}>{getField(item, "phone") || "—"}</span>
                              </div>
                            </td>
                            <td className={`${styles.td} ${styles.dateCell}`}>{fmtDate(getField(item, "date"))}</td>
                            <td className={styles.td}>
                              <span className={styles.badge} style={{ color: s.color, background: s.bg }}>
                                <span className={styles.badgeDot} style={{ background: s.dot }} />
                                {s.label}
                              </span>
                            </td>
                            <td className={styles.td}>
                              <div className={styles.actionsCell}>
                                {displayUrl && (
                                  <button
                                    className={styles.iconBtn}
                                    title="Ver PDF"
                                    onClick={() => {
                                      setPreviewUrl(displayUrl);
                                      setPreviewTitle(signedUrl ? "Documento firmado" : "Documento enviado");
                                    }}
                                  >
                                    <i className="fas fa-eye" />
                                  </button>
                                )}
                                {displayUrl && (
                                  <a className={styles.iconBtn} title="Descargar" href={displayUrl} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-download" />
                                  </a>
                                )}
                                <button
                                  className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
                                  title="Reenviar"
                                  onClick={() => handleResend(item)}
                                  disabled={resendingId === resolveId(item)}
                                >
                                  {resendingId === resolveId(item) ? (
                                    <span className={styles.btnSpinner} />
                                  ) : (
                                    <i className="fas fa-rotate-right" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination inside card */}
                {totalPages > 1 && (
                  <div className={styles.paginationBar}>
                    <span className={styles.paginationInfo}>
                      Página {page} de {totalPages}
                    </span>
                    <div className={styles.paginationButtons}>
                      <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(page - 1)}>
                        <i className="fas fa-chevron-left" />
                      </button>
                      {getPageNumbers().map((p, i) =>
                        p === "..." ? (
                          <span key={`e${i}`} className={styles.pageEllipsis}>…</span>
                        ) : (
                          <button
                            key={p}
                            className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        )
                      )}
                      <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        <i className="fas fa-chevron-right" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {previewUrl && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={styles.modal}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
              >
                <div className={styles.modalHeader}>
                  <div>
                    <p className={styles.modalKicker}>Previsualización</p>
                    <h4>{previewTitle}</h4>
                  </div>
                  <div className={styles.modalActions}>
                    <a className={styles.linkBtn} href={previewUrl} target="_blank" rel="noopener noreferrer">
                      Abrir en nueva pestaña <i className="fas fa-arrow-up-right-from-square" />
                    </a>
                    <button className={styles.closeBtn} onClick={() => setPreviewUrl("")}>
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </div>
                <div className={styles.modalBody}>
                  <object data={previewUrl} type="application/pdf" width="100%" height="100%" aria-label="Vista previa PDF">
                    <iframe src={previewUrl} title="Vista PDF" width="100%" height="100%" />
                  </object>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppShell>
  );
}
