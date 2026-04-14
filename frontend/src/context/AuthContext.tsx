import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../db/firebase';

interface AuthContextType {
  user: User | null;
  clinicId: string | null;
  pendingApproval: boolean;
  loading: boolean;
  isSuperAdmin: boolean;
  isClinicAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isClinicAdmin, setIsClinicAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubSuperAdmin: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (unsubSuperAdmin) { unsubSuperAdmin(); unsubSuperAdmin = null; }
      setUser(u);

      if (u) {
        // Verificar si es superadmin del sistema
        unsubSuperAdmin = onSnapshot(
          doc(db, 'superadmins', u.uid),
          (snap) => {
            console.log('[Superadmin] doc exists:', snap.exists(), '| uid:', u.uid);
            setIsSuperAdmin(snap.exists());
          },
          (err) => {
            console.error('[Superadmin] Error leyendo superadmins/', u.uid, err.code, err.message);
          }
        );

        unsubUser = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.status === 'pending') {
              setPendingApproval(true);
              setClinicId(null);
              setIsClinicAdmin(false);
            } else {
              setPendingApproval(false);
              setClinicId(data.clinicId as string);
              setIsClinicAdmin(data.role === 'admin');
            }
          } else {
            // No hay doc → es el dueño de la clínica
            setPendingApproval(false);
            setClinicId(u.uid);
            setIsClinicAdmin(false);
          }
          setLoading(false);
        });
      } else {
        setClinicId(null);
        setPendingApproval(false);
        setIsSuperAdmin(false);
        setIsClinicAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
      if (unsubSuperAdmin) unsubSuperAdmin();
    };
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, clinicId, pendingApproval, loading, isSuperAdmin, isClinicAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
