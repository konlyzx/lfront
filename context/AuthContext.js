"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, onAuthStateChanged, signOut, doc, getDoc } from "@/lib/firebase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const snap = await getDoc(userDocRef);
                    if (snap.exists()) {
                        setUserData(snap.data());
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserData(null);
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
