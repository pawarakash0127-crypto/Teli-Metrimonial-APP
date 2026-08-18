import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, onAuthStateChanged, doc, setDoc, updateDoc, onSnapshot } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { checkProfileCompleteness, ProfileCompletenessResult, MandatoryField } from '../lib/profileCompleteness';
import { assignGlobalProfileIdInTransaction } from '../lib/profileIdUtils';

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
  userProfile: any | null;
  isProfileComplete: boolean;
  missingMandatoryFields: MandatoryField[];
  profileCompletenessResult: ProfileCompletenessResult | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  userProfile: null,
  isProfileComplete: false,
  missingMandatoryFields: [],
  profileCompletenessResult: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: () => void;
    let unsubscribeProfileDoc: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
          
          // 1. Subscribe to users collection (for role, favorites, account metadata)
          unsubscribeUserDoc = onSnapshot(userDocRef, async (docSnap) => {
            const isEmailAdmin = firebaseUser.email === 'admin@admin.com' || (firebaseUser.email === 'pawarakash0127@gmail.com' && firebaseUser.emailVerified);
            if (docSnap.exists()) {
              const userData = docSnap.data() as UserProfile;
              if (isEmailAdmin && userData.role !== 'admin') {
                userData.role = 'admin';
                await updateDoc(userDocRef, { role: 'admin' }).catch(() => {});
              }
              setProfile(userData);
            } else {
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                ...(firebaseUser.email ? { email: firebaseUser.email } : {}),
                ...(firebaseUser.phoneNumber ? { phoneNumber: firebaseUser.phoneNumber } : {}),
                role: isEmailAdmin ? 'admin' : 'user',
                createdAt: new Date().toISOString(),
                favorites: []
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);
            }
          }, (error) => {
            console.error("Error fetching user account snapshot:", error);
          });

          // 2. Subscribe to profiles collection (for marriage profile completeness check & auto-repair)
          unsubscribeProfileDoc = onSnapshot(profileDocRef, async (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile(data);

              // Auto-populate Marriage Contact Number from Firebase Auth phone if contactNumber is empty
              const authPhone = firebaseUser.phoneNumber || '';
              const cleanDigits = authPhone.replace(/[^\d]/g, '');
              const normPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

              const updatesToApply: any = {};

              if (normPhone && (!data.contactNumber || String(data.contactNumber).trim() === '')) {
                updatesToApply.contactNumber = normPhone;
              }

              if (normPhone && (!data.parentsContact || String(data.parentsContact).trim() === '')) {
                updatesToApply.parentsContact = normPhone;
              }

              if (firebaseUser.email && (!data.email || String(data.email).trim() === '')) {
                updatesToApply.email = firebaseUser.email.toLowerCase().trim();
              }

              // Auto-assign Vadu/Var ID atomically in Firestore if missing
              if (!data.vaduVarNumber || !data.profileId) {
                try {
                  const assignedId = await assignGlobalProfileIdInTransaction(data.gender);
                  updatesToApply.profileId = assignedId;
                  updatesToApply.vaduVarNumber = assignedId;
                } catch (err) {
                  console.warn("Notice assigning missing profile ID in AuthContext:", err);
                }
              }

              if (Object.keys(updatesToApply).length > 0) {
                await updateDoc(profileDocRef, updatesToApply).catch(e => console.warn("Notice updating profile doc in AuthContext:", e));
                if (updatesToApply.vaduVarNumber) {
                  await updateDoc(userDocRef, {
                    profileId: updatesToApply.vaduVarNumber,
                    vaduVarNumber: updatesToApply.vaduVarNumber
                  }).catch(() => {});
                }
              }
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error fetching matrimony profile snapshot:", error);
            setLoading(false);
          });

        } catch (error) {
          console.error("Error setting up user profile snapshot:", error);
          setLoading(false);
        }
      } else {
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        if (unsubscribeProfileDoc) unsubscribeProfileDoc();
        setProfile(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (unsubscribeProfileDoc) unsubscribeProfileDoc();
    };
  }, []);

  // Compute profile completeness dynamically based on live Firestore userProfile document
  const completenessResult = checkProfileCompleteness(userProfile);
  // Admins bypass mandatory profile lock if needed, but for regular users it is strictly required
  const isProfileComplete = profile?.role === 'admin' ? true : completenessResult.isComplete;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        userProfile, 
        isProfileComplete, 
        missingMandatoryFields: completenessResult.missingFields,
        profileCompletenessResult: completenessResult,
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

