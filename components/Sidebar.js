"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./Sidebar.module.css";

const CORE_NAV_ITEMS = [
  { href: "/", icon: "fa-paper-plane", label: "Envío de Firma" },
  { href: "/historial", icon: "fa-clock-rotate-left", label: "Historial" },
  { href: "/manual", icon: "fa-book-open", label: "Manual" },
];

const ADMIN_NAV_ITEMS = [
  { href: "/admin", icon: "fa-chart-line", label: "Dashboard" },
  { href: "/admin/usuarios", icon: "fa-users", label: "Usuarios" },
];

const DEV_NAV_ITEMS = [
  { href: "/admin/logs", icon: "fa-terminal", label: "Logs" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userData } = useAuth();
  const role = userData?.role;

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navSections = [
    { key: "core", title: "", items: CORE_NAV_ITEMS },
    ...(role === "admin" ? [{ key: "admin", title: "Administración", items: ADMIN_NAV_ITEMS }] : []),
    ...(role === "dev" ? [{ key: "dev", title: "Developer", items: DEV_NAV_ITEMS }] : []),
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/img/logo.png" alt="Legaly" width={34} height={34} priority style={{ borderRadius: 10, objectFit: "contain" }} />
          <span className={styles.brandText}>
            <span className={styles.brandName}>Legaly</span>
            <span className={styles.brandTag}>Firmas seguras</span>
          </span>
        </Link>
      </div>

      <nav className={styles.sidebarNav}>
        {navSections.map((section) => (
          <div key={section.key} className={styles.navGroup}>
            {section.title ? <div className={styles.navSectionTitle}>{section.title}</div> : null}
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}>
                  {active && (
                    <motion.div
                      className={styles.activeBg}
                      layoutId="activeNav"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className={styles.iconWrapper}><i className={`fas ${item.icon}`} /></span>
                  <span className={styles.label}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            {userData?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userRole}>
              {userData?.role === "admin" ? "Administrador" : userData?.role === "dev" ? "Developer" : "Usuario"}
            </span>
            <span className={styles.userEmail} title={userData?.email}>{userData?.email || "..."}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
