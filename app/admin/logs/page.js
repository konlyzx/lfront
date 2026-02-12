"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fetchHistorial, fetchHistorialSupabase } from "@/lib/api";
import styles from "./page.module.css";

const REFRESH_MS = 12000;

const LEVEL_META = {
  info: { label: "Info", color: "#0369a1", bg: "#f0f9ff" },
  warn: { label: "Warn", color: "#92400e", bg: "#fffbeb" },
  error: { label: "Error", color: "#991b1b", bg: "#fef2f2" },
};

function pickItems(raw) {
  return Array.isArray(raw) ? raw : raw?.data || [];
}

function getStatus(item) {
  return item?.firma?.status || item?.status || "Sin estado";
}

function mapLevel(status) {
  if (status === "Firmado con Video") return "info";
  if (status === "Rechazado" || status === "Error" || status === "Cancelado" || status === "Expirado") return "error";
  return "warn";
}

function parseDate(raw) {
  const value = raw || new Date().toISOString();
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? Date.now() : ts;
}

function formatDate(ts) {
  return new Date(ts).toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function toLogRecord(item, index) {
  const status = getStatus(item);
  const level = mapLevel(status);
  const timestamp = parseDate(item?.firma?.last_updated || item?.fecha || item?.created_at);
  const actor = item?.firma?.recipient_name || item?.cedula || "Sistema";
  const sender = item?.firma?.sender_name || "Sin remitente";
  const documentUrl = item?.firma?.modified_pdf_url || item?.firma?.document_url || "";
  const fileName = documentUrl ? documentUrl.split("?")[0].split("/").pop() : "Sin archivo";

  return {
    id: `${item?.id || "row"}-${index}-${timestamp}`,
    ts: timestamp,
    level,
    status,
    event: `Documento ${status}`,
    actor,
    detail: `${sender} | ${fileName}`,
  };
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [lastSyncTs, setLastSyncTs] = useState(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!alive) return;
      setSyncing(true);
      try {
        const token = localStorage.getItem("token");
        let raw = await fetchHistorial(token);
        let items = pickItems(raw);
        if ((!items || items.length === 0) && raw?.warning) {
          raw = await fetchHistorialSupabase();
          items = pickItems(raw);
        }
        if (!alive) return;

        const nextLogs = items.map(toLogRecord).sort((a, b) => b.ts - a.ts).slice(0, 250);
        setLogs(nextLogs);
        setError("");
        setLastSyncTs(Date.now());
      } catch (mainError) {
        try {
          const raw = await fetchHistorialSupabase();
          const items = pickItems(raw);
          if (!alive) return;
          const nextLogs = items.map(toLogRecord).sort((a, b) => b.ts - a.ts).slice(0, 250);
          setLogs(nextLogs);
          setError("");
          setLastSyncTs(Date.now());
        } catch (fallbackError) {
          if (!alive) return;
          setError(fallbackError.message || "No se pudieron cargar logs");
        }
      } finally {
        if (alive) {
          setLoading(false);
          setSyncing(false);
        }
      }
    };

    run();
    const intervalId = setInterval(run, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (levelFilter && item.level !== levelFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.event.toLowerCase().includes(q) ||
        item.actor.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    });
  }, [logs, search, levelFilter]);

  const counters = useMemo(() => {
    return filteredLogs.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.level] += 1;
        return acc;
      },
      { total: 0, info: 0, warn: 0, error: 0 }
    );
  }, [filteredLogs]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.page}>
      <div className={styles.head}>
        <div>
          <h2>Logs de sistema</h2>
          <p>Eventos operativos y trazabilidad de envios</p>
        </div>
        <div className={styles.syncBadge}>
          <i className={`fas ${syncing ? "fa-rotate fa-spin" : "fa-clock"}`} />
          {lastSyncTs ? `Actualizado ${formatDate(lastSyncTs)}` : "Sin sincronizar"}
        </div>
      </div>

      <div className={styles.counters}>
        <div className={styles.counterCard}><span>Total</span><strong>{counters.total}</strong></div>
        <div className={styles.counterCard}><span>Info</span><strong>{counters.info}</strong></div>
        <div className={styles.counterCard}><span>Warn</span><strong>{counters.warn}</strong></div>
        <div className={styles.counterCard}><span>Error</span><strong>{counters.error}</strong></div>
      </div>

      <div className={styles.filters}>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className={styles.input}>
          <option value="">Todos los niveles</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
          placeholder="Buscar por evento, actor o detalle..."
        />
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.state}>Cargando logs...</div>
        ) : error ? (
          <div className={styles.stateError}>Error: {error}</div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.state}>Sin logs para los filtros aplicados.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nivel</th>
                  <th>Evento</th>
                  <th>Actor</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((item) => {
                  const levelMeta = LEVEL_META[item.level] || LEVEL_META.warn;
                  return (
                    <tr key={item.id}>
                      <td>{formatDate(item.ts)}</td>
                      <td>
                        <span className={styles.badge} style={{ background: levelMeta.bg, color: levelMeta.color }}>
                          {levelMeta.label}
                        </span>
                      </td>
                      <td>{item.event}</td>
                      <td>{item.actor}</td>
                      <td>{item.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
