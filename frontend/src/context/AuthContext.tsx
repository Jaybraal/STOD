import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../db/firebase';

interface AuthContextType {
  user: User | null;
  clinicId: string | null;
  pendingApproval: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubUser) { unsubUser(); unsubUser = null; }
      setUser(u);

      if (u) {
        unsubUser = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.status === 'pending') {
              setPendingApproval(true);
              setClinicId(null);
            } else {
              setPendingApproval(false);
              setClinicId(data.clinicId as string);
            }
          } else {
            // No hay doc → es el dueño de la clínica
            setPendingApproval(false);
            setClinicId(u.uid);
          }
          setLoading(false);
        });
      } else {
        setClinicId(null);
        setPendingApproval(false);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, clinicId, pendingApproval, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
