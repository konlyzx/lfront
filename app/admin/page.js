"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { db, collection, getDocs } from "@/lib/firebase";
import { fetchHistorial, fetchHistorialSupabase } from "@/lib/api";
import styles from "./page.module.css";

const REFRESH_MS = 15000;
const MAX_POINTS = 20;

function pickHistorialItems(raw) {
  return Array.isArray(raw) ? raw : raw?.data || [];
}

function getStatus(item) {
  return item?.firma?.status || item?.status || "";
}

function toMetricSnapshot(items, totalUsers) {
  const totalDocs = items.length;
  const pending = items.filter((item) => {
    const status = getStatus(item);
    return status === "Esperando Firma" || status === "Esperando Video" || status === "Enviado";
  }).length;
  const signed = items.filter((item) => getStatus(item) === "Firmado con Video").length;
  const failed = items.filter((item) => {
    const status = getStatus(item);
    return status === "Rechazado" || status === "Error" || status === "Cancelado" || status === "Expirado";
  }).length;
  const successRate = totalDocs > 0 ? Number(((signed / totalDocs) * 100).toFixed(1)) : 0;

  return {
    totalDocs,
    totalUsers,
    pending,
    signed,
    failed,
    successRate,
  };
}

function buildLinePoints(values, width = 540, height = 170, padding = 16) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function formatLastSync(ts) {
  if (!ts) return "Sin sincronizar";
  return new Date(ts).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function TrendChart({ history }) {
  const docs = history.map((item) => item.totalDocs);
  const signed = history.map((item) => item.signed);
  const pending = history.map((item) => item.pending);

  const docsPath = buildLinePoints(docs);
  const signedPath = buildLinePoints(signed);
  const pendingPath = buildLinePoints(pending);

  return (
    <div className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <h4>Evolución de métricas</h4>
        <span>Últimos {history.length || 0} cortes</span>
      </div>
      <div className={styles.chartFrame}>
        <svg viewBox="0 0 540 170" preserveAspectRatio="none" className={styles.chartSvg}>
          <polyline className={styles.chartLineDocs} points={docsPath} />
          <polyline className={styles.chartLineSigned} points={signedPath} />
          <polyline className={styles.chartLinePending} points={pendingPath} />
        </svg>
      </div>
      <div className={styles.chartLegend}>
        <span><i className={`${styles.legendDot} ${styles.legendDocs}`} /> Documentos</span>
        <span><i className={`${styles.legendDot} ${styles.legendSigned}`} /> Firmados</span>
        <span><i className={`${styles.legendDot} ${styles.legendPending}`} /> Pendientes</span>
      </div>
    </div>
  );
}

function DistributionChart({ stats }) {
  const total = Math.max(stats.totalDocs || 0, 1);
  const signedPct = Math.round(((stats.signed || 0) / total) * 100);
  const pendingPct = Math.round(((stats.pending || 0) / total) * 100);
  const failedPct = Math.round(((stats.failed || 0) / total) * 100);

  return (
    <div className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <h4>Distribución actual</h4>
        <span>{stats.totalDocs || 0} registros</span>
      </div>

      <div className={styles.progressRow}>
        <div className={styles.progressLabel}>Firmados</div>
        <div className={styles.progressTrack}><div className={styles.progressFillSigned} style={{ width: `${signedPct}%` }} /></div>
        <div className={styles.progressValue}>{signedPct}%</div>
      </div>
      <div className={styles.progressRow}>
        <div className={styles.progressLabel}>Pendientes</div>
        <div className={styles.progressTrack}><div className={styles.progressFillPending} style={{ width: `${pendingPct}%` }} /></div>
        <div className={styles.progressValue}>{pendingPct}%</div>
      </div>
      <div className={styles.progressRow}>
        <div className={styles.progressLabel}>Fallidos</div>
        <div className={styles.progressTrack}><div className={styles.progressFillFailed} style={{ width: `${failedPct}%` }} /></div>
        <div className={styles.progressValue}>{failedPct}%</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDocs: null,
    totalUsers: null,
    pending: null,
    signed: null,
    failed: null,
    successRate: null,
  });
  const [history, setHistory] = useState([]);
  const [lastSyncTs, setLastSyncTs] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!alive) return;
      setSyncing(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const totalUsers = usersSnap.size;

        const token = localStorage.getItem("token");
        let raw = await fetchHistorial(token);
        let items = pickHistorialItems(raw);
        if ((!items || items.length === 0) && raw?.warning) {
          raw = await fetchHistorialSupabase();
          items = pickHistorialItems(raw);
        }

        const snapshot = toMetricSnapshot(items, totalUsers);
        if (!alive) return;

        setStats(snapshot);
        setHistory((prev) => [...prev, { ...snapshot, ts: Date.now() }].slice(-MAX_POINTS));
        setLastSyncTs(Date.now());
      } catch (err) {
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          const totalUsers = usersSnap.size;
          const raw = await fetchHistorialSupabase();
          const items = pickHistorialItems(raw);
          const snapshot = toMetricSnapshot(items, totalUsers);

          if (!alive) return;
          setStats(snapshot);
          setHistory((prev) => [...prev, { ...snapshot, ts: Date.now() }].slice(-MAX_POINTS));
          setLastSyncTs(Date.now());
        } catch (fallbackError) {
          console.error("Error loading admin metrics:", fallbackError);
        }
      } finally {
        if (alive) setSyncing(false);
      }
    };

    run();
    const intervalId = setInterval(run, REFRESH_MS);

    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, []);

  const statCards = useMemo(
    () => [
      { icon: "fa-file-signature", label: "Documentos", value: stats.totalDocs, color: "#3B82F6", bg: "#EFF6FF" },
      { icon: "fa-users", label: "Usuarios", value: stats.totalUsers, color: "#7C3AED", bg: "#F5F3FF" },
      { icon: "fa-clock", label: "Pendientes", value: stats.pending, color: "#F59E0B", bg: "#FFFBEB" },
      { icon: "fa-circle-check", label: "Firmados", value: stats.signed, color: "#10B981", bg: "#ECFDF5" },
      { icon: "fa-chart-line", label: "Tasa éxito", value: stats.successRate !== null ? `${stats.successRate}%` : null, color: "#0EA5E9", bg: "#F0F9FF" },
    ],
    [stats]
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div initial="hidden" animate="show" variants={container}>
      <motion.div variants={item} className={styles.heroCard}>
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>Dashboard de Administración</h2>
          <p className={styles.heroDesc}>Monitoreo operativo con actualización automática cada 15 segundos.</p>
        </div>
        <div className={styles.syncBadge}>
          <i className={`fas ${syncing ? "fa-rotate fa-spin" : "fa-clock"}`} />
          {syncing ? "Actualizando..." : `Actualizado ${formatLastSync(lastSyncTs)}`}
        </div>
      </motion.div>

      <motion.div variants={item} className={styles.section}>
        <div className={styles.sectionHeader}>
          <i className={`fas fa-chart-pie ${styles.sectionIcon}`} />
          <h3 className={styles.sectionTitle}>Métricas en tiempo real</h3>
        </div>
        <div className={styles.statsGrid}>
          {statCards.map((card, index) => (
            <motion.div
              key={index}
              className={styles.statCard}
              variants={item}
              whileHover={{ y: -1, boxShadow: "0 8px 20px -12px rgba(2,6,23,0.45)" }}
            >
              <div className={styles.statIconWrap} style={{ background: card.bg }}>
                <i className={`fas ${card.icon}`} style={{ color: card.color }} />
              </div>
              <div>
                {card.value !== null ? <div className={styles.statValue}>{card.value}</div> : <div className={styles.statLoading} />}
                <div className={styles.statLabel}>{card.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className={styles.section}>
        <div className={styles.sectionHeader}>
          <i className={`fas fa-wave-square ${styles.sectionIcon}`} />
          <h3 className={styles.sectionTitle}>Charts</h3>
        </div>
        <div className={styles.chartsGrid}>
          <TrendChart history={history} />
          <DistributionChart stats={stats} />
        </div>
      </motion.div>

      <motion.div variants={item} className={styles.section}>
        <div className={styles.sectionHeader}>
          <i className={`fas fa-bolt ${styles.sectionIcon}`} />
          <h3 className={styles.sectionTitle}>Acciones rápidas</h3>
        </div>
        <div className={styles.actionsGrid}>
          <Link href="/admin/usuarios" style={{ textDecoration: "none" }}>
            <motion.div className={`${styles.actionCard} ${styles.actionPrimary}`} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <div className={styles.actionIcon}><i className="fas fa-user-plus" /></div>
              <div className={styles.actionText}>
                <div className={styles.actionTitle}>Gestionar usuarios</div>
                <div className={styles.actionSub}>Crear, editar o eliminar</div>
              </div>
              <i className={`fas fa-arrow-right ${styles.actionArrow}`} />
            </motion.div>
          </Link>
          <Link href="/" style={{ textDecoration: "none" }}>
            <motion.div className={`${styles.actionCard} ${styles.actionSecondary}`} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <div className={styles.actionIcon}><i className="fas fa-paper-plane" /></div>
              <div className={styles.actionText}>
                <div className={styles.actionTitle}>Enviar firma</div>
                <div className={styles.actionSub}>Nuevo envío de documento</div>
              </div>
            </motion.div>
          </Link>
          <Link href="/historial" style={{ textDecoration: "none" }}>
            <motion.div className={`${styles.actionCard} ${styles.actionSecondary}`} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <div className={styles.actionIcon}><i className="fas fa-clock-rotate-left" /></div>
              <div className={styles.actionText}>
                <div className={styles.actionTitle}>Ver historial</div>
                <div className={styles.actionSub}>Registro de envíos</div>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
