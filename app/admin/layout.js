"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

function getAdminTitle(pathname) {
  if (pathname === "/admin/usuarios") return "Usuarios";
  if (pathname === "/admin/logs") return "Logs";
  return "Dashboard";
}

export default function AdminLayout({ children }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = userData?.role;
  const onLogs = pathname.startsWith("/admin/logs");
  const canAccess = onLogs ? role === "dev" : role === "admin";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (onLogs && role !== "dev") {
      router.replace(role === "admin" ? "/admin" : "/");
      return;
    }
    if (!onLogs && role === "dev") {
      router.replace("/admin/logs");
      return;
    }
    if (!onLogs && role !== "admin") {
      router.replace("/");
    }
  }, [loading, user, role, onLogs, router]);

  if (loading || !user || !canAccess) {
    return (
      <div className="admin-guard-loading">
        <div className="spinner" />
        <style jsx>{`
          .admin-guard-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-soft);
          }
        `}</style>
      </div>
    );
  }

  return <AppShell title={getAdminTitle(pathname)}>{children}</AppShell>;
}
