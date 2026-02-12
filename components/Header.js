"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";

export default function Header({ title }) {
  const { user, userData, logout } = useAuth();

  return (
    <header className={styles.appHeader}>
      <h1 className={styles.title}>{title}</h1>
      {user && (
        <div className={styles.headerUser}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userData?.name || "Usuario"}</span>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
          <button onClick={logout} className={styles.logoutBtn} title="Cerrar sesión">
            <i className="fas fa-arrow-right-from-bracket" />
          </button>
        </div>
      )}
    </header>
  );
}
