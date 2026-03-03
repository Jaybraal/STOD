import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../db/firebase';

interface AuthContextType {
  user: User | null;
  clinicId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Verificar si este usuario pertenece a otra clínica (se unió con código)
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setClinicId(userDoc.data().clinicId as string);
        } else {
          setClinicId(u.uid); // Dueño: su propio UID es el clinicId
        }
      } else {
        setClinicId(null);
      }
      setLoading(false);
    });
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, clinicId, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
