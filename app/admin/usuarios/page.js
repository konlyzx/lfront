"use client";

import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API = {
    CREATE: `${BACKEND_URL}/crear-usuario`,
    UPDATE_ROLE: `${BACKEND_URL}/actualizar-rol`,
    DELETE: `${BACKEND_URL}/eliminar-usuario`,
};

export default function UsuariosPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user" });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const snap = await getDocs(collection(db, "users"));
            const list = [];
            snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            setUsers(list);
        } catch (err) {
            showToast("Error al cargar usuarios: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            showToast("Completa todos los campos", "error");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(API.CREATE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al crear usuario");
            showToast(`Usuario ${formData.name} creado con éxito`);
            setFormData({ name: "", email: "", password: "", role: "user" });
            loadUsers();
        } catch (err) {
            showToast(err.message.includes("already") ? "El correo ya está en uso" : err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API.DELETE}/${deleteModal.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            showToast(`Usuario ${deleteModal.name} eliminado`);
            setDeleteModal(null);
            loadUsers();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setDeleting(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!editModal) return;
        setUpdating(true);
        try {
            const res = await fetch(`${API.UPDATE_ROLE}/${editModal.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: editModal.newRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            showToast(`Rol actualizado a ${editModal.newRole === "admin" ? "Administrador" : "Usuario"}`);
            setEditModal(null);
            loadUsers();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}
                    >
                        <i className={`fas ${toast.type === "error" ? "fa-circle-exclamation" : "fa-circle-check"}`} />
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create User */}
            <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                    <span className={styles.cardTitleIcon}><i className="fas fa-user-plus" /></span>
                    Crear Nuevo Usuario
                </h3>
                <form onSubmit={handleCreate} className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Nombre</label>
                            <input className={styles.fieldInput} type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre completo" required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Correo Electrónico</label>
                            <input className={styles.fieldInput} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com" required />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Contraseña</label>
                            <input className={styles.fieldInput} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Contraseña segura" required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Rol</label>
                            <select className={styles.fieldSelect} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button type="button" className={styles.btnSecondary} onClick={() => setFormData({ name: "", email: "", password: "", role: "user" })}>
                            <i className="fas fa-rotate-left" /> Limpiar
                        </button>
                        <motion.button type="submit" className={styles.btnPrimary} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            {saving ? <div className={styles.btnSpinner} /> : <><i className="fas fa-save" /> Guardar Usuario</>}
                        </motion.button>
                    </div>
                </form>
            </div>

            {/* Users Table */}
            <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                    <span className={styles.cardTitleIcon}><i className="fas fa-users" /></span>
                    Usuarios Existentes
                </h3>
                {loading ? (
                    <div className={styles.centerMsg}><div className={styles.spinner2} /></div>
                ) : users.length === 0 ? (
                    <div className={styles.centerMsg}><p>No hay usuarios registrados.</p></div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th}>Nombre</th>
                                    <th className={styles.th}>Correo Electrónico</th>
                                    <th className={styles.th}>Rol</th>
                                    <th className={styles.th}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <motion.tr
                                        key={u.id}
                                        className={styles.tr}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <td className={styles.td}>{u.name || "Sin nombre"}</td>
                                        <td className={styles.td}>{u.email}</td>
                                        <td className={styles.td}>
                                            <span className={`${styles.roleBadge} ${u.role === "admin" ? styles.roleAdmin : styles.roleUser}`}>
                                                <i className={`fas ${u.role === "admin" ? "fa-shield-halved" : "fa-user"}`} style={{ fontSize: 10 }} />
                                                {u.role === "admin" ? "Administrador" : "Usuario"}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.actionsCell}>
                                                <motion.button
                                                    className={`${styles.iconBtn} ${styles.iconBtnEdit}`}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setEditModal({ id: u.id, name: u.name, role: u.role, newRole: u.role })}
                                                >
                                                    <i className="fas fa-user-pen" />
                                                </motion.button>
                                                <motion.button
                                                    className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setDeleteModal({ id: u.id, name: u.name || "Usuario", email: u.email })}
                                                >
                                                    <i className="fas fa-trash" />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteModal && (
                    <div className={styles.modalOverlay} onClick={() => !deleting && setDeleteModal(null)}>
                        <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <div className={styles.modalHeader}>
                                <h4 className={styles.modalTitle}>Confirmar Eliminación</h4>
                                <button className={styles.modalClose} onClick={() => !deleting && setDeleteModal(null)}>&times;</button>
                            </div>
                            <div className={styles.modalBody}>
                                <p>¿Estás seguro que deseas eliminar al usuario <strong>{deleteModal.name}</strong> ({deleteModal.email})?</p>
                                <p className={styles.modalWarning}>Esta acción no se puede deshacer.</p>
                            </div>
                            <div className={styles.modalFooter}>
                                <button className={styles.btnSecondary} onClick={() => setDeleteModal(null)} disabled={deleting}>Cancelar</button>
                                <button className={styles.btnDanger} onClick={handleDelete} disabled={deleting}>
                                    {deleting ? <div className={styles.btnSpinner} /> : <><i className="fas fa-trash" /> Eliminar</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editModal && (
                    <div className={styles.modalOverlay} onClick={() => !updating && setEditModal(null)}>
                        <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <div className={styles.modalHeader}>
                                <h4 className={styles.modalTitle}>Cambiar Rol de Usuario</h4>
                                <button className={styles.modalClose} onClick={() => !updating && setEditModal(null)}>&times;</button>
                            </div>
                            <div className={styles.modalBody}>
                                <p>Modificar rol para: <strong>{editModal.name}</strong></p>
                                <div className={styles.field} style={{ marginTop: 16 }}>
                                    <label className={styles.fieldLabel}>Nuevo rol</label>
                                    <select className={styles.fieldSelect} value={editModal.newRole} onChange={(e) => setEditModal({ ...editModal, newRole: e.target.value })}>
                                        <option value="user">Usuario</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button className={styles.btnSecondary} onClick={() => setEditModal(null)} disabled={updating}>Cancelar</button>
                                <button className={styles.btnPrimary} onClick={handleUpdateRole} disabled={updating}>
                                    {updating ? <div className={styles.btnSpinner} /> : <><i className="fas fa-save" /> Guardar</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
