import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, onSnapshot } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface UserProfile {
  uid: string;
  email?: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  createdAt: string;
  favorites?: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // Use onSnapshot to get real-time updates (e.g., for favorites)
          unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
              setLoading(false);
            } else {
              // Check if this is the default admin
              const isDefaultAdmin = firebaseUser.email === 'pawarakash0127@gmail.com' && firebaseUser.emailVerified;
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                ...(firebaseUser.email ? { email: firebaseUser.email } : {}),
                ...(firebaseUser.phoneNumber ? { phoneNumber: firebaseUser.phoneNumber } : {}),
                role: isDefaultAdmin ? 'admin' : 'user',
                createdAt: new Date().toISOString(),
                favorites: []
              };
              await setDoc(userDocRef, newProfile);
              // The snapshot will trigger again after setDoc, so we don't need to manually setProfile here,
              // but we can to be safe.
              setProfile(newProfile);
              setLoading(false);
            }
          }, (error) => {
            console.error("Error fetching user profile snapshot:", error);
            setLoading(false);
          });
          
        } catch (error) {
          console.error("Error setting up user profile snapshot:", error);
          setLoading(false);
        }
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
