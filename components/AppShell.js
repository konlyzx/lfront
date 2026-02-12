"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import styles from "./AppShell.module.css";

export default function AppShell({ children, title = "Legaly" }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.appShell}>
      <Sidebar />
      <main className={styles.appMain}>
        <Header title={title} />
        <div className={styles.appContent}>{children}</div>
      </main>
    </div>
  );
}
